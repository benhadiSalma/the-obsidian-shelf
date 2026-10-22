<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the initial bookstore catalog.
     */
    public function run(): void
    {
        $this->call(BookSeeder::class);
    }
}
