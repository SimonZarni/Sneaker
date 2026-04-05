<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\PromoCode;

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
        'cancelled_at',
        'cancellation_reason',
        'cancellation_note',
        'shipping_fee',
        'promo_code_id',
        'discount_amount',
        'delivered_at',
    ];

    protected $casts = [
        'placed_at'       => 'datetime',
        'cancelled_at'    => 'datetime',
        'delivered_at'    => 'datetime',
        'total_amount'    => 'decimal:2',
        'shipping_fee'    => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }
}
