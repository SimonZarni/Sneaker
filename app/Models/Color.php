<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Color extends Model
{
    // Add this line to tell Laravel this table doesn't have created_at/updated_at
    public $timestamps = false;

    protected $fillable = ['name', 'hex_code'];
}
