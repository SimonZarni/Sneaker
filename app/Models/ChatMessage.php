<?php

namespace App\Models;

use App\Enums\MessageType;
use App\Services\ChatEncryptionService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'payload',
        'message_type',
        'read_at',
        'edited_at',
        // body stays fillable for dual-write rollback safety until the column is dropped
        'body',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'edited_at' => 'datetime',
        'message_type' => MessageType::class,
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function decryptedText(ChatEncryptionService $crypto): string
    {
        return $crypto->decrypt($this->payload, $this->conversation_id);
    }
}
