<?php

namespace App\Events;

use App\Models\ChatMessage;
use App\Models\ChatConversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage      $message,
        public ChatConversation $conversation,
    ) {}

    public function broadcastOn(): array
    {
        return [
            // User's private channel — only the user in this conversation
            new PrivateChannel("chat.{$this->conversation->id}"),
            // Admin channel — all admins receive all messages
            new PrivateChannel('admin-chat'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->message->id,
            'conversation_id' => $this->conversation->id,
            'user_id'         => $this->conversation->user_id,
            'user_name'       => $this->conversation->user->name ?? 'Customer',
            'sender_type'     => $this->message->sender_type,
            'body'            => $this->message->body,
            'created_at'      => $this->message->created_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'chat.message';
    }
}
