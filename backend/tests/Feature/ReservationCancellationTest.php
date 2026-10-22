<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservationCancellationTest extends TestCase
{
    use RefreshDatabase;

    private function createBook(int $stock = 3): Book
    {
        return Book::create([
            'isbn' => '9781408899991',
            'title' => 'The Cancellation Manuscript',
            'author' => 'Test Author',
            'description' => 'A book used for reservation tests.',
            'price' => 19.95,
            'stock' => $stock,
            'tropes' => ['Fantasy'],
        ]);
    }

    private function reserveBook(User $user, Book $book): int
    {
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/reservations', [
            'book_id' => $book->id,
        ]);

        $response->assertCreated();

        return (int) $response->json('reservation.id');
    }

    public function test_cancellation_restores_stock(): void
    {
        $book = $this->createBook(3);
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        $this->assertSame(2, $book->fresh()->stock);

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('reservation.status', 'cancelled');

        $this->assertSame(3, $book->fresh()->stock);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'user_id' => $user->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cancellation_before_deadline(): void
    {
        $book = $this->createBook();
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        $this->travel(23)->hours();
        $this->travel(59)->minutes();

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(3, $book->fresh()->stock);
    }

    public function test_cancellation_at_deadline_is_refused(): void
    {
        $book = $this->createBook();
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        $this->travel(24)->hours();

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertSame(2, $book->fresh()->stock);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'status' => 'confirmed',
        ]);
    }

    public function test_double_cancellation_is_refused(): void
    {
        $book = $this->createBook();
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertOk();

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertStatus(409);

        $this->assertSame(3, $book->fresh()->stock);
    }

    public function test_another_user_cannot_cancel(): void
    {
        $book = $this->createBook();
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $reservationId = $this->reserveBook($owner, $book);

        Sanctum::actingAs($otherUser);

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertNotFound();

        $this->assertSame(2, $book->fresh()->stock);
    }

    public function test_guest_cannot_cancel(): void
    {
        $this->deleteJson('/api/reservations/123')
            ->assertUnauthorized();
    }

    public function test_collected_book_cannot_be_cancelled(): void
    {
        $book = $this->createBook();
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        Reservation::findOrFail($reservationId)->update([
            'status' => 'collected',
        ]);

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertStatus(409);

        $this->assertSame(2, $book->fresh()->stock);
    }

    public function test_cancelled_reservation_cannot_be_reviewed(): void
    {
        $book = $this->createBook();
        $user = User::factory()->create();
        $reservationId = $this->reserveBook($user, $book);

        $this->deleteJson("/api/reservations/{$reservationId}")
            ->assertOk();

        $this->postJson("/api/books/{$book->id}/reviews", [
            'score' => 5,
            'content' => 'This review should be refused.',
        ])->assertForbidden();

        $this->assertDatabaseCount('reviews', 0);
    }}