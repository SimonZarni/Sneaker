<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'brand_id', 'category_id', 'gender_id', 'name',
        'description', 'base_price', 'main_image_url', 'is_active'
    ];

    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function gender(): BelongsTo { return $this->belongsTo(Gender::class); }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
