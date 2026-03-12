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
        Schema::create('carts', function ($table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('cart_items', function ($table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('restrict');
            $table->integer('quantity')->default(1);
            $table->timestamps();
            $table->unique(['cart_id', 'product_variant_id']);
        });

        Schema::create('orders', function ($table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('address_id')->nullable()->constrained('user_addresses')->onDelete('set null');
            $table->string('order_number')->unique();
            $table->decimal('total_amount', 10, 2);
            $table->string('order_status')->default('Confirmed');
            $table->string('payment_status')->default('Pending');
            $table->string('delivery_status')->default('Pending');
            $table->string('shipping_full_name');
            $table->string('shipping_phone');
            $table->string('shipping_address_line');
            $table->string('shipping_city');
            $table->string('shipping_state_region')->nullable();
            $table->string('shipping_postal_code')->nullable();
            $table->string('shipping_country');
            $table->timestamp('placed_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('order_items', function ($table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('set null');
            $table->string('product_name');
            $table->string('brand_name');
            $table->string('category_name');
            $table->string('gender_name');
            $table->string('color_name');
            $table->string('size_value');
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });

        Schema::create('payments', function ($table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('payment_method');
            $table->string('cardholder_name')->nullable();
            $table->string('card_last4', 4)->nullable();
            $table->string('payment_status')->default('Pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_management_tables');
    }
};
