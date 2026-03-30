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
                    'id'    => $request->user()->id,
                    'name'  => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,

                // Active order count — only recomputed when the cache is stale.
                // Cache key is per-user so counts never bleed between accounts.
                // Busted by OrderController whenever an order status changes.
                'activeOrderCount' => Auth::check()
                    ? Cache::remember(
                        'active_order_count_' . Auth::id(),
                        120, // 2-minute TTL — fresh enough, cheap enough
                        fn () => \App\Models\Order::where('user_id', Auth::id())
                            ->whereIn('delivery_status', ['Pending', 'Processing', 'Shipped'])
                            ->count()
                    )
                    : 0,
            ],

            // Cart — lazy prop so Inertia only evaluates it when the frontend
            // actually requests it (partial reload). On pages that don't include
            // 'cart' in their partial props list the closure is never called,
            // eliminating 4 eager-load queries on every page navigation.
            'cart' => Auth::check()
                ? \Inertia\Inertia::lazy(function () {
                    return $this->resolveCart();
                })
                : null,

            // Navigation data — cached for 1 hour, busted by AdminSettingsController.
            'navigation' => Cache::remember('navigation', 3600, fn () => [
                'brands'     => \App\Models\Brand::select('id', 'name', 'logo_url')->get(),
                'categories' => \App\Models\Category::select('id', 'name')->get(),
                'genders'    => \App\Models\Gender::select('id', 'name')->get(),
            ]),
        ]);
    }

    /**
     * Resolve the authenticated user's cart with all relations needed by the
     * cart drawer. Extracted here so it can be called from the lazy closure
     * without polluting share().
     */
    private function resolveCart(): ?Cart
    {
        $cart = Cart::with([
            'items' => fn ($q) => $q->whereHas(
                'productVariant',
                fn ($q) => $q->whereHas(
                    'product',
                    fn ($q) => $q->where('is_active', true)
                )
            ),
            'items.productVariant.product' => fn ($q) => $q->select(
                'id',
                'name',
                'base_price',
                'sale_price',
                'sale_ends_at',
                'main_image_url',
                'is_active'
            ),
            'items.productVariant.size'  => fn ($q) => $q->select('id', 'size_value'),
            'items.productVariant.color' => fn ($q) => $q->select('id', 'name', 'hex_code'),
        ])->where('user_id', Auth::id())->first();

        if (! $cart) {
            return null;
        }

        $cart->items->each(function ($item) {
            $product = $item->productVariant?->product;
            if ($product) {
                $product->setAttribute('is_on_sale',      $product->isOnSale());
                $product->setAttribute('effective_price', $product->effectivePrice());
            }
        });

        return $cart;
    }
}
