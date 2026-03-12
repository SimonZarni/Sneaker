<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Home', [
            'featured' => Product::with('brand')->where('is_active', true)->limit(4)->get(),
        ]);
    }
}
