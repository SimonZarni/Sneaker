<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Size extends Model
{
    // Add this line
    public $timestamps = false;

    protected $fillable = ['name'];
}
