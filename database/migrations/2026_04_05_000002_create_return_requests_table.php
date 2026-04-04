<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected, Refunded
            $table->string('refund_method');               // Original Card, Bank Transfer, Store Credit
            $table->string('refund_account_details')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable(); // set on approval
            $table->text('admin_note')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
