<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    /**
     * Add sample books only to an empty catalog.
     * Existing stock and reservations are never reset.
     */
    public function run(): void
    {
        if (Book::query()->exists()) {
            return;
        }

        $adjectives = [
            'The Silken', 'A Dark', 'The Crimson', 'A Golden',
            'The Shadowed', 'A Cursed', 'The Broken', 'The Hidden',
            'Midnight', 'The Secret', 'A Wicked', 'The Velvet',
        ];

        $nouns = [
            'Throne', 'Crown', 'Marionette', 'Duke',
            'Empire', 'Blade', 'Dragon', 'Rose',
            'Heart', 'Archive', 'Villainess', 'Academy',
        ];

        $authors = [
            'Elara Voss', 'Rowan Vale', 'Lyra Ashcroft',
            'Cassian Blackwood', 'Iris Thorn',
            'Aster Nocturne', 'Mara Nightfall', 'Selene Wren',
        ];

        $tropes = [
            'Enemies to Lovers',
            'Slow Burn',
            'Found Family',
            'Fake Dating',
            'Royal Intrigue',
            'Dark Magic',
            'Chosen One',
            'Grumpy x Sunshine',
            'Fated Mates',
            'Morally Grey Love Interest',
        ];

        // Generate 30 unique fictional book entries.

        for ($i = 0; $i < 30; $i++) {
            $title = $adjectives[$i % count($adjectives)]
                . ' ' . $nouns[intdiv($i, count($adjectives))];

            Book::create([
                'isbn' => $this->sampleIsbn($i + 1),
                'title' => $title,
                'author' => $authors[$i % count($authors)],
                'description' =>
                    'A mysterious tale about power, love, and destiny within the walls of ' . $title . '.',
                'price' => 12.99 + ($i % 17),
                'stock' => 5 + ($i % 26),
                'tropes' => [
                    $tropes[$i % count($tropes)],
                    $tropes[($i + 3) % count($tropes)],
                ],
            ]);
        }

        // Three featured titles from the original catalog.

        $featuredBooks = [
            [
                'isbn' => $this->sampleIsbn(31),
                'title' => 'A Court of Thorns and Roses',
                'author' => 'Sarah J. Maas',
                'description' =>
                    'Feyre enters the dangerous world of the fae courts, where old secrets and impossible bargains change her fate.',
                'price' => 18.99,
                'stock' => 12,
                'tropes' => [
                    'Enemies to Lovers',
                    'Fae',
                    'Magic',
                ],
            ],
            [
                'isbn' => $this->sampleIsbn(32),
                'title' => 'The Villainess is a Marionette',
                'author' => 'Han Yi-rim',
                'description' =>
                    'Princess Cayena gets a chance to rewrite her fate and escape the political games surrounding her.',
                'price' => 14.99,
                'stock' => 20,
                'tropes' => [
                    'Reincarnation',
                    'Political Intrigue',
                    'Villainess',
                ],
            ],
            [
                'isbn' => $this->sampleIsbn(33),
                'title' => 'Fourth Wing',
                'author' => 'Rebecca Yarros',
                'description' =>
                    'Violet Sorrengail enters a brutal dragon rider academy where survival is never guaranteed.',
                'price' => 24.50,
                'stock' => 5,
                'tropes' => [
                    'Enemies to Lovers',
                    'Dragons',
                    'Slow Burn',
                ],
            ],
        ];

        foreach ($featuredBooks as $book) {
            Book::create($book);
        }
    }

    /**
     * Generate a unique, checksum-valid sample ISBN-13.
     * These are demo identifiers, not official publisher ISBNs.
     */
    private function sampleIsbn(int $number): string
    {
        $firstTwelve = sprintf('97814088%04d', $number);
        $sum = 0;

        foreach (str_split($firstTwelve) as $position => $digit) {
            $sum += (int) $digit
                * ($position % 2 === 0 ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return $firstTwelve . $checkDigit;
    }
}