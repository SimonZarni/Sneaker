<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [

            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
            ],

            // 1. Cart — only include items whose variant and product still exist and are active.
            //    Injects effective_price and is_on_sale onto each product so the frontend
            //    always displays and calculates the correct sale price without extra logic.
            'cart' => Auth::check()
                ? (function () {
                    $cart = \App\Models\Cart::with([
                        'items' => fn($q) => $q->whereHas('productVariant', fn($q) =>
                            $q->whereHas('product', fn($q) =>
                                $q->where('is_active', true)
                            )
                        ),
                        // Select only columns needed by the cart drawer —
                        // excludes description (TEXT), created_by_admin_id etc.
                        'items.productVariant.product' => fn($q) => $q->select(
                            'id', 'name', 'base_price', 'sale_price',
                            'sale_ends_at', 'main_image_url', 'is_active'
                        ),
                        'items.productVariant.size'  => fn($q) => $q->select('id', 'size_value'),
                        'items.productVariant.color' => fn($q) => $q->select('id', 'name', 'hex_code'),
                    ])->where('user_id', Auth::id())->first();

                    if (!$cart) return null;

                    // Inject computed sale fields onto each product so they
                    // serialise through to the React frontend automatically.
                    $cart->items->each(function ($item) {
                        $product = $item->productVariant?->product;
                        if ($product) {
                            $product->setAttribute('is_on_sale',     $product->isOnSale());
                            $product->setAttribute('effective_price', $product->effectivePrice());
                        }
                    });

                    return $cart;
                })()
                : null,

            // 2. Global Navigation Data — cached for 1 hour.
            // Brands, categories, and genders rarely change, so hitting the DB
            // on every page load for every visitor is wasteful. Cache is busted
            // in AdminSettingsController whenever any of these are created,
            // updated, or deleted.
            'navigation' => Cache::remember('navigation', 3600, fn() => [
                'brands'     => \App\Models\Brand::select('id', 'name', 'logo_url')->get(),
                'categories' => \App\Models\Category::select('id', 'name')->get(),
                'genders'    => \App\Models\Gender::select('id', 'name')->get(),
            ]),
        ]);
    }
}
