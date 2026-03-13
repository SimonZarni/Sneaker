<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Gender;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::with(['brand', 'category', 'gender'])
            ->where('is_active', true);

        $query->when($request->input('brand'), fn($q, $v) => $q->where('brand_id', $v));
        $query->when($request->input('gender'), fn($q, $v) => $q->where('gender_id', $v));
        $query->when($request->input('category'), fn($q, $v) => $q->where('category_id', $v));
        $query->when($request->input('search'), fn($q, $v) => $q->where('name', 'like', "%{$v}%"));

        // Price sort
        match ($request->input('sort')) {
            'price_asc'  => $query->orderBy('base_price', 'asc'),
            'price_desc' => $query->orderBy('base_price', 'desc'),
            default      => $query->latest(),
        };

        $products = $query->get()->map(fn($p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'base_price'     => $p->base_price,
            'main_image_url' => $p->main_image_url,
            'brand'          => ['id' => $p->brand_id, 'name' => $p->brand?->name],
            'category'       => ['id' => $p->category_id, 'name' => $p->category?->name],
            'gender'         => ['id' => $p->gender_id, 'name' => $p->gender?->name],
        ]);

        return Inertia::render('Shop/Index', [
            'products'   => $products,
            'brands'     => Brand::orderBy('name')->get(['id', 'name']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'genders'    => Gender::orderBy('name')->get(['id', 'name']),
            'filters'    => $request->only(['brand', 'gender', 'category', 'search', 'sort']),
            'total'      => Product::where('is_active', true)->count(),
        ]);
    }

    public function show(int $id): Response
    {
        $product = Product::with([
            'brand', 'category', 'gender',
            'variants.size', 'variants.color',
        ])->findOrFail($id);

        return Inertia::render('Shop/Show', ['product' => $product]);
    }
}
