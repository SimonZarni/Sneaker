<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $featured = Product::with('brand')
            ->where('is_active', true)
            ->latest()
            ->limit(4)
            ->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'name'            => $p->name,
                'base_price'      => $p->base_price,
                'sale_price'      => $p->isOnSale() ? $p->sale_price : null,
                'effective_price' => $p->effectivePrice(),
                'is_on_sale'      => $p->isOnSale(),
                'main_image_url'  => $p->main_image_url,
                'brand'           => ['name' => $p->brand?->name],
            ]);

        return Inertia::render('Home', ['featured' => $featured]);
    }
}
