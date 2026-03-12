<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Admins & Support Tables
        Schema::create('admins', function ($table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });

        Schema::create('brands', function ($table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('logo_url')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function ($table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('genders', function ($table) {
            $table->id();
            $table->string('name')->unique();
        });

        Schema::create('colors', function ($table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('hex_code', 10)->nullable();
        });
        
        Schema::create('sizes', function ($table) {
            $table->id();
            $table->string('size_value')->unique();
        });

        // 2. User Addresses
        Schema::create('user_addresses', function ($table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->string('address_line');
            $table->string('city');
            $table->string('state_region')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // 3. Products & Variants
        Schema::create('products', function ($table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->onDelete('restrict');
            $table->foreignId('category_id')->constrained()->onDelete('restrict');
            $table->foreignId('gender_id')->constrained()->onDelete('restrict');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->string('main_image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->onDelete('set null');
            $table->foreignId('updated_by_admin_id')->nullable()->constrained('admins')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('product_variants', function ($table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('color_id')->constrained()->onDelete('restrict');
            $table->foreignId('size_id')->constrained()->onDelete('restrict');
            $table->decimal('variant_price', 10, 2)->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->unique(['product_id', 'color_id', 'size_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('initial_shop_tables');
    }
};
