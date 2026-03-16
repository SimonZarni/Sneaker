<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WishlistController extends Controller
{
    public function index()
    {
        $items = Wishlist::with(['product.brand', 'product.category'])
            ->where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(fn($w) => [
                'id'         => $w->id,
                'product_id' => $w->product_id,
                'name'       => $w->product->name,
                'brand'      => $w->product->brand?->name,
                'category'   => $w->product->category?->name,
                'base_price' => $w->product->base_price,
                'image_url'  => $w->product->main_image_url,
                'is_active'  => $w->product->is_active,
                'added_at'   => $w->created_at->toISOString(),
            ]);

        return Inertia::render('Wishlist/Index', ['items' => $items]);
    }

    /** Toggle: add if absent, remove if present. */
    public function toggle(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id']);

        $userId    = Auth::id();
        $productId = $request->input('product_id');

        $existing = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            $existing->delete();
            $wishlisted = false;
        } else {
            // Only wishlist active products — deactivated products should not
            // be saveable, even if the button is still visible momentarily.
            $product = \App\Models\Product::where('id', $productId)
                ->where('is_active', true)
                ->first();

            if (!$product) {
                return back()->withErrors(['wishlist' => 'This product is no longer available.']);
            }

            Wishlist::create(['user_id' => $userId, 'product_id' => $productId]);
            $wishlisted = true;
        }

        return back()->with('wishlisted', $wishlisted);
    }

    public function destroy(int $id)
    {
        Wishlist::where('user_id', Auth::id())->findOrFail($id)->delete();
        return back();
    }
}
