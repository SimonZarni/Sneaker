<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'color_id', 'size_id',
        'variant_price', 'stock_quantity', 'image_url'
    ];

    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    public function color(): BelongsTo { return $this->belongsTo(Color::class); }
    public function size(): BelongsTo { return $this->belongsTo(Size::class); }
}
