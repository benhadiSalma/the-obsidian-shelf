<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoReviewSeeder extends Seeder
{
    public function run(): void
    {
        // Never create fictional reviews in production.
        if (app()->environment('production')) {
            $this->command?->warn(
                'Demo reviews are disabled in production.'
            );

            return;
        }

        // Fictional readers.
        $readers = [
            [
                'name' => 'Avery (Demo)',
                'username' => 'demo_scribe_avery',
                'email' => 'avery@demo.invalid',
            ],
            [
                'name' => 'Rowan (Demo)',
                'username' => 'demo_scribe_rowan',
                'email' => 'rowan@demo.invalid',
            ],
            [
                'name' => 'Lyra (Demo)',
                'username' => 'demo_scribe_lyra',
                'email' => 'lyra@demo.invalid',
            ],
            [
                'name' => 'Cassian (Demo)',
                'username' => 'demo_scribe_cassian',
                'email' => 'cassian@demo.invalid',
            ],
        ];

        // Reviews with different ratings and opinions.
        $comments = [
            [
                'score' => 5,
                'content' =>
                    '[Demo review] Absolutely magical! The characters and atmosphere were unforgettable.',
            ],
            [
                'score' => 4,
                'content' =>
                    '[Demo review] A captivating story with wonderful world-building and interesting twists.',
            ],
            [
                'score' => 5,
                'content' =>
                    '[Demo review] I could not put this book down. The romance and tension were perfect!',
            ],
            [
                'score' => 3,
                'content' =>
                    '[Demo review] An interesting story, although some chapters felt a little slow.',
            ],
            [
                'score' => 4,
                'content' =>
                    '[Demo review] Beautiful writing and memorable characters. I enjoyed this adventure.',
            ],
            [
                'score' => 5,
                'content' =>
                    '[Demo review] One of my favourite fantasy reads. I loved the mysterious atmosphere!',
            ],
            [
                'score' => 3,
                'content' =>
                    '[Demo review] The concept was promising, but I wanted more character development.',
            ],
            [
                'score' => 4,
                'content' =>
                    '[Demo review] A lovely mix of romance, magic and unexpected revelations.',
            ],
        ];

        // Reuse existing demo accounts when available.
        $users = [];

        foreach ($readers as $reader) {
            $users[] = User::firstOrCreate(
                [
                    'email' => $reader['email'],
                ],
                [
                    'name' => $reader['name'],
                    'username' => $reader['username'],
                    'password' => Str::random(48),
                ]
            );
        }

        // Include every book, even books currently out of stock.
        $books = Book::query()
            ->orderBy('id')
            ->get();

        $created = 0;

        foreach ($books as $book) {

            // Each book receives a stable target:
            // two, three or four reviews.
            $target = 2 + ($book->id % 3);

            // Keep all reviews that already exist.
            $count = $book->reviews()->count();

            if ($count >= $target) {
                continue;
            }

            foreach ($users as $index => $user) {
                if ($count >= $target) {
                    break;
                }

                // Never duplicate a user's review.
                $alreadyReviewed = Review::query()
                    ->where('user_id', $user->id)
                    ->where('book_id', $book->id)
                    ->exists();

                if ($alreadyReviewed) {
                    continue;
                }

                $comment = $comments[
                    ($book->id + $index) % count($comments)
                ];

                DB::transaction(function () use (
                    $user,
                    $book,
                    $comment
                ) {
                    // Simulate a historical reservation.
                    // Do not change current stock.
                    Reservation::firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'book_id' => $book->id,
                        ],
                        [
                            'status' => 'collected',
                            'price_at_reservation' => $book->price,
                            'pickup_until' => now()->addDays(7),
                        ]
                    );

                    // Store the fictional review.
                    Review::firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'book_id' => $book->id,
                        ],
                        [
                            'score' => $comment['score'],
                            'content' => $comment['content'],
                        ]
                    );
                });

                $count++;
                $created++;
            }
        }

        $this->command?->info(
            "Demo reviews completed. {$created} new reviews added."
        );
    }
}