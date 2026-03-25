<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');                   // Unique push URL per browser/device
            $table->string('public_key', 255);          // p256dh
            $table->string('auth_token', 255);          // auth
            $table->string('user_agent')->nullable();   // For display in settings ("Chrome on Android")
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            // A user can have multiple devices — one subscription per endpoint
            $table->unique('endpoint', 'push_subscriptions_endpoint_unique');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
