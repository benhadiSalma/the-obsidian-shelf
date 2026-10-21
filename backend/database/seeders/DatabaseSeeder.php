<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        
        User::create([
            'name' => 'Salma',
            'username' => 'Grand Scribe',
            'email' => 'admin@ehb.be',
            'password' => Hash::make('Password!321'),
            'is_admin' => true,
        ]);

        
        User::create([
            'name' => 'Demo Reader',
            'username' => 'VelvetReader',
            'email' => 'reader@test.com',
            'password' => Hash::make('Password!321'),
            'is_admin' => false,
        ]);

        
        $this->call([
            BookSeeder::class,
        ]);
    }
}
