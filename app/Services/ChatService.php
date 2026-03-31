<?php

namespace App\Services;

use App\Enums\MessageType;
use App\Events\ChatMessageSent;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatService
{
    public function __construct(private ChatEncryptionService $crypto) {}

    /**
     * Return a serialised conversation history for a user (or admin by conversation ID).
     * Falls back to `body` when `payload` is null (legacy messages).
     */
    public function getMessages(ChatConversation $conversation): array
    {
        return $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'sender_type' => $m->sender_type,
                'text' => $this->resolveText($m),
                'message_type' => $m->message_type?->value ?? MessageType::Text->value,
                'created_at' => $m->created_at->toISOString(),
            ])
            ->all();
    }

    /**
     * Decrypt a single message and return its serialised form.
     */
    public function getSingleMessage(ChatMessage $message): array
    {
        return [
            'id' => $message->id,
            'sender_type' => $message->sender_type,
            'text' => $this->resolveText($message),
            'message_type' => $message->message_type?->value ?? MessageType::Text->value,
            'created_at' => $message->created_at->toISOString(),
        ];
    }

    /**
     * Persist a new message with dual-write (payload + body) inside a DB transaction,
     * then broadcast ChatMessageSent. Returns the created ChatMessage.
     */
    public function send(
        ChatConversation $conversation,
        string $senderType,
        int $senderId,
        string $text,
        MessageType $type = MessageType::Text,
        array $extras = []
    ): ChatMessage {
        $payload = $this->crypto->encrypt(
            json_encode($this->crypto->buildPayload($type, $text, $extras)),
            $conversation->id
        );

        $message = DB::transaction(function () use ($conversation, $senderType, $senderId, $text, $type, $payload) {
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type' => $senderType,
                'sender_id' => $senderId,
                'payload' => $payload,
                'message_type' => $type,
                // Dual-write: keep body for rollback safety until backfill is verified
                // and the body column is dropped in a future migration.
                'body' => $text,
            ]);

            $conversation->update(['last_message_at' => now()]);

            return $message;
        });

        try {
            broadcast(new ChatMessageSent($message, $conversation->load('user')));
        } catch (\Throwable $e) {
            Log::warning('Chat broadcast failed', [
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $message;
    }

    /**
     * Decrypt payload if present; fall back to body for legacy rows.
     */
    private function resolveText(ChatMessage $message): string
    {
        if ($message->payload !== null) {
            $json = $this->crypto->decrypt($message->payload, $message->conversation_id);

            return $this->crypto->parsePayload($json)['text'];
        }

        return $message->body ?? '';
    }
}
