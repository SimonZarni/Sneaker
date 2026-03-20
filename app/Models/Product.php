<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'brand_id', 'category_id', 'gender_id', 'name',
        'description', 'base_price', 'main_image_url', 'is_active',
        'sale_price', 'sale_ends_at',
    ];

    protected $casts = [
        'sale_ends_at' => 'datetime',
        'sale_price'   => 'decimal:2',
        'base_price'   => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function brand(): BelongsTo    { return $this->belongsTo(Brand::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function gender(): BelongsTo   { return $this->belongsTo(Gender::class); }
    public function variants(): HasMany   { return $this->hasMany(ProductVariant::class); }

    /**
     * Returns true when the product has an active sale price right now.
     */
    public function isOnSale(): bool
    {
        if ($this->sale_price === null) return false;
        if ($this->sale_ends_at !== null && $this->sale_ends_at->isPast()) return false;
        return true;
    }

    /**
     * The price the customer actually pays — sale price if on sale, base price otherwise.
     */
    public function effectivePrice(): string
    {
        return $this->isOnSale()
            ? number_format((float) $this->sale_price, 2, '.', '')
            : number_format((float) $this->base_price, 2, '.', '');
    }
}
