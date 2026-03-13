<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;

class AdminSeeder extends Seeder
{
    /**
     * Run this seeder to create the default admin account.
     * After seeding, log in at /admin/login with these credentials.
     *
     * Email:    admin@sneaker.drp
     * Password: admin123
     */
    public function run(): void
    {
        Admin::updateOrCreate(
            ['email' => 'admin@sneaker.drp'],
            [
                'full_name' => 'Store Admin',
                'password'  => Hash::make('admin123'),
            ]
        );
    }
}
