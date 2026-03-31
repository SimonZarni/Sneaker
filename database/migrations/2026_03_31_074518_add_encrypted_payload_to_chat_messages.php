<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            // Nullable for zero-downtime: backfill command fills this in.
            // A follow-up migration (separate PR) converts to NOT NULL after backfill.
            $table->text('payload')->nullable()->after('body');
            $table->string('message_type', 20)->default('text')->after('payload');
            $table->timestamp('edited_at')->nullable()->after('read_at');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['payload', 'message_type', 'edited_at']);
        });
    }
};
