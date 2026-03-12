<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'address_id',
        'order_number',
        'total_amount',
        'order_status',
        'payment_status',
        'delivery_status',
        'shipping_full_name',
        'shipping_phone',
        'shipping_address_line',
        'shipping_city',
        'shipping_state_region',
        'shipping_postal_code',
        'shipping_country',
        'placed_at',
    ];

    protected $casts = [
        'placed_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
