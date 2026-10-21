<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BookSeeder extends Seeder
{
    public function run(): void
    {
        $adjectives = [
            'The Silken', 'A Dark', 'The Crimson', 'A Golden', 'The Shadowed', 
            'A Cursed', 'The Broken', 'The Hidden', 'Midnight', 'The Secret', 
            'A Wicked', 'The Velvet'
        ];

        $nouns = [
            'Throne', 'Crown', 'Marionette', 'Duke', 'Empire', 'Blade', 
            'Dragon', 'Rose', 'Heart', 'Archive', 'Villainess', 'Academy'
        ];

        $tropesList = [
            'Enemies to Lovers', 'Slow Burn', 'Found Family', 'Fake Dating', 
            'Royal Intrigue', 'Dark Magic', 'Chosen One', 'Grumpy x Sunshine',
            'Fated Mates', 'Morally Grey Love Interest'
        ];

        $authors = [
            'Sarah J. Maas', 'Han Yi-rim', 'Rebecca Yarros', 'Julia Quinn', 
            'Baek Ji-yeon', 'Leigh Bardugo', 'V.E. Schwab', 'Holly Black'
        ];

        
        for ($i = 0; $i < 30; $i++) {
            $randomTitle = $adjectives[array_rand($adjectives)] . ' ' . $nouns[array_rand($nouns)];
            $randomAuthor = $authors[array_rand($authors)];
            
           
            $randomTropes = collect($tropesList)->random(rand(2, 3))->toArray();

            Book::create([
                'isbn' => '978-' . rand(100000000, 999999999),
                'title' => $randomTitle,
                'author' => $randomAuthor,
                'description' => 'A mysterious tale about power, love, and destiny within the walls of ' . $randomTitle . '.',
                'price' => rand(12, 29) + 0.99, 
                'stock' => rand(0, 50), 
                'tropes' => $randomTropes
            ]);
        }

       
        Book::create([
            'isbn' => '978-0-123456-47-2',
            'title' => 'A Court of Thorns and Roses',
            'author' => 'Sarah J. Maas',
            'description' => 'When nineteen-year-old huntress Feyre kills a wolf, her life is dragged into a dangerous world of fae courts, secrets, and impossible bargains.',
            'price' => 18.99,
            'stock' => 12,
            'tropes' => ['Enemies to Lovers', 'Fae', 'Magic', 'Beauty and the Beast retelling']
        ]);

        Book::create([
            'isbn' => '978-0-000000-00-1',
            'title' => 'The Villainess is a Marionette',
            'author' => 'Han Yi-rim',
            'description' => 'Princess Cayena was once treated like a beautiful doll, but her return gives her the chance to rewrite her fate.',
            'price' => 14.99,
            'stock' => 20,
            'tropes' => ['Reincarnation', 'Political Intrigue', 'Villainess']
        ]);

        Book::create([
            'isbn' => '978-1-987654-32-1',
            'title' => 'Fourth Wing',
            'author' => 'Rebecca Yarros',
            'description' => 'Violet Sorrengail enters a brutal dragon rider academy where survival, loyalty, and power are tested at every turn.',
            'price' => 24.50,
            'stock' => 5,
            'tropes' => ['Enemies to Lovers', 'Dragons', 'War College', 'Slow Burn']
        ]);
    }
}