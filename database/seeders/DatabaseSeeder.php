<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create your primary Test Account (The keys to the vault)
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'), // Now you can actually log in!
        ]);

        // 2. Optional: Create a few random users to populate your database
        User::factory(5)->create();

        // 3. Call your Sneaker Catalog Seeder
        // This ensures all Brands, Categories, and Products exist
        $this->call([
            SneakerSeeder::class,
            AdminSeeder::class, // Don't forget to seed the admin account!
        ]);
    }
}
