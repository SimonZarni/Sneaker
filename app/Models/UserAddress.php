<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserAddress extends Model
{
    protected $fillable = [
        'user_id', 'full_name', 'phone', 'address_line',
        'city', 'state_region', 'postal_code', 'country', 'is_default'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}
