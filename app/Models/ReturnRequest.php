<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReturnRequest extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'status',
        'refund_method',
        'refund_account_details',
        'refund_amount',
        'admin_note',
        'requested_at',
        'resolved_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'resolved_at'  => 'datetime',
        'refund_amount' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }
}
