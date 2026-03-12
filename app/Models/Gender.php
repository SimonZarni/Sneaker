<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gender extends Model {
    public $timestamps = false; // Based on your migration
    protected $fillable = ['name'];

    public function products() {
        return $this->hasMany(Product::class);
    }
}
