<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookReviewPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_book_reviews_do_not_expose_private_user_data(): void
    {
        $book = Book::create([
            'isbn' => '9781234567897',
            'title' => 'The Privacy Manuscript',
            'author' => 'Test Author',
            'description' => 'A fictional book used for testing.',
            'price' => 15.90,
            'stock' => 2,
            'tropes' => ['Fantasy'],
        ]);

        $reader = User::factory()->create([
            'name' => 'Privacy Reader',
            'username' => 'privacy_reader',
            'email' => 'private@example.test',
        ]);

        $reader->reviews()->create([
            'book_id' => $book->id,
            'score' => 5,
            'content' => 'A wonderful read.',
        ]);

        // This endpoint is public: no authentication needed.
        $response = $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('reviews.0.user.id', $reader->id)
            ->assertJsonPath('reviews.0.user.name', 'Privacy Reader')
            ->assertJsonPath('reviews.0.user.username', 'privacy_reader');

        $publicUser = $response->json('reviews.0.user');

        $this->assertIsArray($publicUser);
        $this->assertEqualsCanonicalizing(
            ['id', 'name', 'username'],
            array_keys($publicUser)
        );

        $this->assertStringNotContainsString(
            'private@example.test',
            $response->getContent()
        );
    }
}
