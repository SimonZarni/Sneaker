<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    protected $fillable = [
        'user_id',
        'notif_key',
        'order_id',
        'order_number',
        'type',
        'title',
        'message',
        'icon',
        'delivery_status',
        'occurred_at',
        'read_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toFrontend(): array
    {
        return [
            'id' => $this->notif_key,
            'order_id' => (int) ($this->order_id ?? 0),
            'order_number' => $this->order_number ?? '',
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'icon' => $this->icon ?: '📦',
            'delivery_status' => $this->delivery_status ?? '',
            'received_at' => optional($this->occurred_at)->toISOString() ?? now()->toISOString(),
            'read' => ! is_null($this->read_at),
        ];
    }
}
