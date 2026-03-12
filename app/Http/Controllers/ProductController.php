<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display the collection with dynamic filtering.
     */
    public function index(Request $request): Response
    {
        // 1. Start the query with necessary relationships
        $query = Product::with(['brand', 'category', 'gender'])
            ->where('is_active', true);

        // 2. Apply filters conditionally based on URL parameters (?brand=1, etc.)
        $query->when($request->input('brand'), function ($q, $brandId) {
            return $q->where('brand_id', $brandId);
        });

        $query->when($request->input('gender'), function ($q, $genderId) {
            return $q->where('gender_id', $genderId);
        });

        $query->when($request->input('category'), function ($q, $categoryId) {
            return $q->where('category_id', $categoryId);
        });

        $query->when($request->input('search'), function ($q, $search) {
            return $q->where('name', 'like', "%{$search}%");
        });

        // 3. Execute query with latest drops first
        $products = $query->latest()->get();

        return Inertia::render('Shop/Index', [
            'products' => $products,
            // Pass the current filters back so the UI can stay in sync
            'filters' => $request->only(['brand', 'gender', 'category'])
        ]);
    }

    /**
     * Display a specific sneaker drop.
     */
    public function show(int $id): Response
    {
        $product = Product::with([
            'brand',
            'category',
            'gender', // Added gender here as well
            'variants.size',
            'variants.color'
        ])->findOrFail($id);

        return Inertia::render('Shop/Show', [
            'product' => $product
        ]);
    }
}
