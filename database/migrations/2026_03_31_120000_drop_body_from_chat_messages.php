<?php

use App\Enums\MessageType;
use App\Models\ChatMessage;
use App\Services\ChatEncryptionService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Backfills any remaining legacy messages (payload = null) before dropping
     * the body column, so this migration is safe to run without a manual
     * pre-deploy step.
     */
    public function up(): void
    {
        $crypto = app(ChatEncryptionService::class);

        ChatMessage::withTrashed()
            ->whereNull('payload')
            ->cursor()
            ->each(function (ChatMessage $message) use ($crypto) {
                $message->updateQuietly([
                    'payload' => $crypto->encrypt(
                        json_encode($crypto->buildPayload(MessageType::Text, $message->body ?? '')),
                        $message->conversation_id
                    ),
                ]);
            });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn('body');
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->text('body')->nullable()->after('sender_id');
        });
    }
};
