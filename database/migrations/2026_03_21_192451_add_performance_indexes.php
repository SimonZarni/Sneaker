<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add missing performance indexes across all critical tables.
 *
 * foreignId() already creates indexes on FK columns (user_id, product_id etc)
 * so those are excluded. This migration covers status columns, timestamps,
 * boolean flags, and composite indexes used in common query patterns.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── orders ────────────────────────────────────────────────────────────
        // Queried heavily by: user order history, admin order filters (status,
        // date range), dashboard counts, weekly/monthly revenue aggregates.
        Schema::table('orders', function (Blueprint $table) {
            // User order history — ORDER::where('user_id',...)->latest('placed_at')
            // Composite covers both the filter and the sort in one index scan
            $table->index(['user_id', 'placed_at'], 'orders_user_placed_at_index');

            // Admin status filter + stat card counts
            $table->index('delivery_status', 'orders_delivery_status_index');
            $table->index('order_status',    'orders_order_status_index');
            $table->index('payment_status',  'orders_payment_status_index');

            // Date range filter + revenue aggregates (placed_at >= X AND <= Y)
            $table->index('placed_at', 'orders_placed_at_index');
        });

        // ── order_items ───────────────────────────────────────────────────────
        // Queried by: hasPurchased check, product delete guard, top products
        // dashboard, order cancel stock restore.
        Schema::table('order_items', function (Blueprint $table) {
            // hasPurchased: whereHas('items', fn => where('product_id', $id))
            $table->index('product_id', 'order_items_product_id_index');
        });

        // ── products ──────────────────────────────────────────────────────────
        // Every shop page load filters by is_active. Admin filters by brand.
        // Navigation cache covers brands/categories but product queries don't.
        Schema::table('products', function (Blueprint $table) {
            // Shop index: where('is_active', true) + orderBy/latest
            $table->index('is_active', 'products_is_active_index');

            // Shop + admin filter by brand/category/gender
            $table->index('brand_id',    'products_brand_id_index');
            $table->index('category_id', 'products_category_id_index');
        });

        // ── product_variants ──────────────────────────────────────────────────
        // Low stock queries on dashboard and inventory page filter by
        // stock_quantity <= 5. These run on every admin dashboard load.
        Schema::table('product_variants', function (Blueprint $table) {
            $table->index('stock_quantity', 'product_variants_stock_quantity_index');
        });

        // ── reviews ───────────────────────────────────────────────────────────
        // Every product page: WHERE product_id = ? AND is_approved = 1
        // Composite index covers both conditions in one lookup.
        Schema::table('reviews', function (Blueprint $table) {
            // unique(['user_id', 'product_id']) already exists from original migration
            $table->index(['product_id', 'is_approved'], 'reviews_product_approved_index');
        });

        // ── cart_items ────────────────────────────────────────────────────────
        // HandleInertiaRequests loads cart on every page for auth'd users.
        // cart_id FK index exists; add product_variant_id for the whereHas filter.
        Schema::table('cart_items', function (Blueprint $table) {
            // whereHas('productVariant', fn => whereHas('product', ...))
            // product_variant_id FK index exists but the subquery benefits from
            // a dedicated index on this column when filtering active products.
            // Skip — foreignId already covers this.
        });

        // ── user_addresses ────────────────────────────────────────────────────
        // Checkout and profile load: where('user_id', $id)->orderBy('is_default')
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->index(['user_id', 'is_default'], 'user_addresses_user_default_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_user_placed_at_index');
            $table->dropIndex('orders_delivery_status_index');
            $table->dropIndex('orders_order_status_index');
            $table->dropIndex('orders_payment_status_index');
            $table->dropIndex('orders_placed_at_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_product_id_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_is_active_index');
            $table->dropIndex('products_brand_id_index');
            $table->dropIndex('products_category_id_index');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('product_variants_stock_quantity_index');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_product_approved_index');
        });

        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropIndex('user_addresses_user_default_index');
        });
    }
};
