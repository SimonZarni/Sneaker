<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_amount',
        'max_uses',
        'uses_count',
        'per_user_limit',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'value'            => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'starts_at'        => 'datetime',
        'expires_at'       => 'datetime',
        'is_active'        => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Validate this promo code against the given subtotal and user.
     * Returns ['valid' => true, 'discount' => float] or ['valid' => false, 'error' => string].
     */
    public function validate(float $subtotal, int $userId): array
    {
        if (!$this->is_active) {
            return ['valid' => false, 'error' => 'This promo code is invalid.'];
        }

        if ($this->starts_at && now()->lt($this->starts_at)) {
            return ['valid' => false, 'error' => 'This promo code is not active yet.'];
        }

        if ($this->expires_at && now()->gt($this->expires_at)) {
            return ['valid' => false, 'error' => 'This promo code has expired.'];
        }

        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) {
            return ['valid' => false, 'error' => 'This promo code has reached its usage limit.'];
        }

        if ($this->min_order_amount !== null && $subtotal < $this->min_order_amount) {
            return ['valid' => false, 'error' => 'Minimum order of $' . number_format($this->min_order_amount, 2) . ' required to use this code.'];
        }

        if ($this->per_user_limit !== null) {
            $userUses = Order::where('user_id', $userId)
                ->where('promo_code_id', $this->id)
                ->count();
            if ($userUses >= $this->per_user_limit) {
                return ['valid' => false, 'error' => 'You have already used this promo code.'];
            }
        }

        return ['valid' => true, 'discount' => $this->calculateDiscount($subtotal)];
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->type === 'percentage') {
            return round($subtotal * ((float) $this->value / 100), 2);
        }

        // Fixed: cap at subtotal so total never goes negative
        return min((float) $this->value, $subtotal);
    }
}
