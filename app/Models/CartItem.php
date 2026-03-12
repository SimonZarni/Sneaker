<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'product_variant_id',
        'quantity'
    ];

    /**
     * The parent vault this item belongs to.
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * The specific sneaker variant (Size/Color) chosen.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    // Add this inside the CartItem class
    public function getSubtotalAttribute()
    {
        // Fetches the price from the variant and multiplies by quantity
        return $this->productVariant->variant_price * $this->quantity;
    }
}
