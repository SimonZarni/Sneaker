<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use Illuminate\Support\Facades\Auth;
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
            //    This prevents a null relationship crash on any page load if a product is
            //    deleted or deactivated while it is sitting in a user's cart.
            'cart' => Auth::check()
                ? (function () {
                    $cart = \App\Models\Cart::with([
                        'items' => fn($q) => $q->whereHas('productVariant', fn($q) =>
                            $q->whereHas('product', fn($q) =>
                                $q->where('is_active', true)
                            )
                        ),
                        'items.productVariant.product',
                        'items.productVariant.size',
                        'items.productVariant.color',
                    ])->where('user_id', Auth::id())->first();
                    return $cart;
                })()
                : null,

            // 2. Global Navigation Data (New)
            'navigation' => [
                'brands' => \App\Models\Brand::select('id', 'name', 'logo_url')->get(),
                'categories' => \App\Models\Category::select('id', 'name')->get(),
                'genders' => \App\Models\Gender::select('id', 'name')->get(),
            ],
        ]);
    }
}
