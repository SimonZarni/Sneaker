<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a unique constraint on payments.order_id.
     *
     * The Order model defines payments() as hasOne(), but without a DB-level
     * unique constraint, a retry or race condition could create two payment
     * records for the same order. This enforces the one-to-one guarantee
     * at the database level, not just the application level.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->unique('order_id', 'payments_order_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_order_id_unique');
        });
    }
};
