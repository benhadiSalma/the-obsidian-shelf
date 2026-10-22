<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookstoreApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create a book for testing.
     */
    private function createBook(int $stock = 3): Book
    {
        return Book::create([
            'isbn' => '9781408800006',
            'title' => 'The Test Manuscript',
            'author' => 'Test Author',
            'description' => 'A book for automated testing.',
            'price' => 17.50,
            'stock' => $stock,
            'tropes' => ['Slow Burn', 'Found Family'],
        ]);
    }

    /**
     * Create and authenticate a reader.
     */
    private function loginAsReader(): User
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        return $user;
    }

    /**
     * TEST 1: Registration requires a username.
     */
    public function test_registration_requires_username(): void
    {
        $this->postJson('/api/register', [
            'name' => 'New Reader',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('username');

        $this->postJson('/api/register', [
            'name' => 'New Reader',
            'username' => 'new_reader',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonStructure([
                'access_token',
                'user' => ['id', 'username', 'email'],
            ]);

        $this->assertDatabaseHas('users', [
            'username' => 'new_reader',
        ]);
    }

    /**
     * TEST 2: Search books and filter by stock.
     */
    public function test_catalog_can_search_by_isbn_and_filter_available_books(): void
    {
        $book = $this->createBook(0);

        $this->getJson('/api/books?search=' . $book->isbn)
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/books?in_stock=1')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    /**
     * TEST 3: Guests cannot reserve books.
     */
    public function test_guest_cannot_reserve_a_book(): void
    {
        $book = $this->createBook();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertUnauthorized();

        $this->assertSame(3, $book->fresh()->stock);

        $this->assertDatabaseCount('reservations', 0);
    }

    /**
     * TEST 4: Reservations decrease stock.
     */
    public function test_reservation_decreases_stock_and_saves_pickup_details(): void
    {
        $book = $this->createBook(2);
        $user = $this->loginAsReader();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])
            ->assertCreated()
            ->assertJsonPath(
                'reservation.status',
                'confirmed'
            )
            ->assertJsonStructure([
                'reservation' => [
                    'id',
                    'book_id',
                    'price_at_reservation',
                    'pickup_until',
                    'book',
                ],
            ]);

        $this->assertSame(1, $book->fresh()->stock);

        $this->assertDatabaseHas('reservations', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'status' => 'confirmed',
        ]);

        $this->getJson('/api/reservations')
            ->assertOk()
            ->assertJsonCount(1);
    }

    /**
     * TEST 5: Stock must never become negative.
     */
    public function test_stock_cannot_become_negative(): void
    {
        $book = $this->createBook(1);

        $this->loginAsReader();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertCreated();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertStatus(409);

        $this->assertSame(0, $book->fresh()->stock);

        $this->assertDatabaseCount('reservations', 1);
    }

    /**
     * TEST 6: Reservation price remains unchanged.
     */
    public function test_reserved_price_does_not_change_after_catalog_price_changes(): void
    {
        $book = $this->createBook();

        $this->loginAsReader();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertCreated();

        $book->update([
            'price' => 29.99,
        ]);

        $this->assertDatabaseHas('reservations', [
            'book_id' => $book->id,
            'price_at_reservation' => 17.50,
        ]);
    }

    /**
     * TEST 7: Only readers who reserved a book
     * can review it, and only once.
     */
    public function test_review_requires_reservation_and_is_limited_to_one_per_book(): void
    {
        $book = $this->createBook();
        $user = $this->loginAsReader();

        $url = "/api/books/{$book->id}/reviews";

        $this->postJson($url, [
            'score' => 5,
            'content' => 'Wonderful book.',
        ])->assertForbidden();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertCreated();

        $this->postJson($url, [
            'score' => 5,
            'content' => 'Wonderful book.',
        ])
            ->assertCreated()
            ->assertJsonPath('review.score', 5);

        $this->postJson($url, [
            'score' => 4,
            'content' => 'Another review.',
        ])->assertStatus(409);

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath(
                'reviews.0.user.id',
                $user->id
            )
            ->assertJsonPath(
                'reviews.0.content',
                'Wonderful book.'
            );
    }

    /**
     * TEST 8: Review score must be 1 to 5.
     */
    public function test_review_score_must_be_between_one_and_five(): void
    {
        $book = $this->createBook();

        $this->loginAsReader();

        $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ])->assertCreated();

        $this->postJson(
            "/api/books/{$book->id}/reviews",
            [
                'score' => 6,
                'content' => 'An invalid score.',
            ]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('score');
    }

    /**
     * TEST 9: Profile changes must be saved.
     */
    public function test_profile_update_is_saved_and_username_must_be_unique(): void
    {
        $this->loginAsReader();

        $other = User::factory()->create([
            'username' => 'already_taken',
        ]);

        $this->patchJson('/api/me', [
            'name' => 'Updated Reader',
            'username' => 'updated_reader',
            'email' => 'updated@example.com',
        ])
            ->assertOk()
            ->assertJsonPath(
                'user.username',
                'updated_reader'
            );

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath(
                'user.name',
                'Updated Reader'
            );

        $this->patchJson('/api/me', [
            'name' => 'Updated Reader',
            'username' => $other->username,
            'email' => 'updated@example.com',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('username');
    }

    /**
     * TEST 10: Wishlists belong to their users.
     */
    public function test_wishlist_is_saved_and_private_to_its_user(): void
    {
        $book = $this->createBook();

        $first = User::factory()->create();
        $second = User::factory()->create();

        Sanctum::actingAs($first);

        $this->postJson('/api/wishlist/toggle', [
            'book_id' => $book->id,
        ])
            ->assertCreated()
            ->assertJsonPath('wishlisted', true);

        $this->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonCount(1);

        Sanctum::actingAs($second);

        $this->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonCount(0);

        Sanctum::actingAs($first);

        $this->postJson('/api/wishlist/toggle', [
            'book_id' => $book->id,
        ])
            ->assertOk()
            ->assertJsonPath('wishlisted', false);

        $this->assertDatabaseCount('wishlists', 0);
    }
}

