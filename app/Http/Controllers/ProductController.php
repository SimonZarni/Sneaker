<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Gender;
use App\Models\Product;
use App\Models\Review;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Wishlist;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::with(['brand', 'category', 'gender'])
            ->where('is_active', true);

        $query->when($request->input('brand'),    fn($q, $v) => $q->where('brand_id', $v));
        $query->when($request->input('gender'),   fn($q, $v) => $q->where('gender_id', $v));
        $query->when($request->input('category'), fn($q, $v) => $q->where('category_id', $v));
        $query->when($request->input('search'),   fn($q, $v) => $q->where('name', 'like', "%{$v}%"));

        match ($request->input('sort')) {
            'price_asc'  => $query->orderBy('base_price', 'asc'),
            'price_desc' => $query->orderBy('base_price', 'desc'),
            default      => $query->latest(),
        };

        $wishlistedIds = Auth::check()
            ? Wishlist::where('user_id', Auth::id())->pluck('product_id')->all()
            : [];

        $products = $query->get()->map(fn($p) => [
            'id'              => $p->id,
            'name'            => $p->name,
            'base_price'      => $p->base_price,
            'sale_price'      => $p->isOnSale() ? $p->sale_price : null,
            'effective_price' => $p->effectivePrice(),
            'is_on_sale'      => $p->isOnSale(),
            'main_image_url'  => $p->main_image_url,
            'brand'           => ['id' => $p->brand_id, 'name' => $p->brand?->name],
            'category'        => ['id' => $p->category_id, 'name' => $p->category?->name],
            'gender'          => ['id' => $p->gender_id, 'name' => $p->gender?->name],
            'wishlisted'      => in_array($p->id, $wishlistedIds),
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
        ])->where('is_active', true)->findOrFail($id);

        // ── Reviews ───────────────────────────────────────────────────────────
        $reviews = Review::with('user:id,name')
            ->where('product_id', $id)
            ->where('is_approved', true)
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'title'      => $r->title,
                'body'       => $r->body,
                'user_name'  => $r->user->name,
                'created_at' => $r->created_at->toISOString(),
            ]);

        $avgRating   = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : null;
        $ratingBreakdown = collect([5,4,3,2,1])->map(fn($s) => [
            'star'  => $s,
            'count' => $reviews->where('rating', $s)->count(),
        ])->all();

        // ── Auth user context ─────────────────────────────────────────────────
        $userReview = null;
        $hasPurchased = false;

        if (Auth::check()) {
            $userReview = Review::where('user_id', Auth::id())
                ->where('product_id', $id)
                ->first();

            $hasPurchased = Order::where('user_id', Auth::id())
                ->where('order_status', '!=', 'Cancelled')
                ->whereHas('items', fn($q) => $q->where('product_id', $id))
                ->exists();
        }

        // ── Wishlist state ────────────────────────────────────────────────────
        $wishlisted = Auth::check()
            ? Wishlist::where('user_id', Auth::id())->where('product_id', $id)->exists()
            : false;

        // ── Related products ──────────────────────────────────────────────────
        // Cache per product for 1 hour to avoid ORDER BY RAND() full table scan
        // on every page load. Cache is tagged with the product id so it naturally
        // expires when the catalog is large and TTL rolls over.
        $related = \Illuminate\Support\Facades\Cache::remember(
            "related.{$id}",
            3600,
            fn() => Product::with('brand')
                ->where('is_active', true)
                ->where('id', '!=', $id)
                ->where(fn($q) =>
                    $q->where('brand_id', $product->brand_id)
                      ->orWhere('category_id', $product->category_id)
                )
                ->latest()
                ->limit(4)
                ->get()
                ->map(fn($p) => [
                    'id'             => $p->id,
                    'name'           => $p->name,
                    'base_price'     => $p->base_price,
                    'main_image_url' => $p->main_image_url,
                    'brand'          => $p->brand?->name,
                ])
        );

        // Append sale info to the product for the PDP
        $productData = $product->toArray();
        $productData['is_on_sale']      = $product->isOnSale();
        $productData['effective_price'] = $product->effectivePrice();

        return Inertia::render('Shop/Show', [
            'product'         => $productData,
            'wishlisted'      => $wishlisted,
            'related'         => $related,
            'reviews'         => $reviews,
            'avgRating'       => $avgRating,
            'reviewCount'     => $reviews->count(),
            'ratingBreakdown' => $ratingBreakdown,
            'userReview'      => $userReview ? [
                'id'     => $userReview->id,
                'rating' => $userReview->rating,
                'title'  => $userReview->title,
                'body'   => $userReview->body,
                'is_approved' => $userReview->is_approved,
            ] : null,
            'hasPurchased'    => $hasPurchased,
        ]);
    }
}
