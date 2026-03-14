<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('rating');
            $table->string('title', 120)->nullable();
            $table->text('body')->nullable();
            $table->boolean('is_approved')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'product_id']); // one review per user per product
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
