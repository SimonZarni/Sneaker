<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    /**
     * Add a sneaker to the user's vault.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'quantity'           => 'nullable|integer|min:1|max:99',
        ]);

        $quantity = $request->input('quantity', 1);

        // Verify the variant is in stock and its product is still active
        $variant = \App\Models\ProductVariant::with('product')
            ->findOrFail($request->product_variant_id);

        if (!$variant->product || !$variant->product->is_active) {
            return back()->withErrors(['cart' => 'This product is no longer available.']);
        }

        if ($variant->stock_quantity <= 0) {
            return back()->withErrors(['cart' => 'Sorry, this item is out of stock.']);
        }

        // Cap requested quantity against available stock
        $quantity = min($quantity, $variant->stock_quantity);

        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);

        // Enforce a max of 20 distinct items per cart
        $existingItem = CartItem::where('cart_id', $cart->id)
            ->where('product_variant_id', $request->product_variant_id)
            ->first();

        if (!$existingItem && $cart->items()->count() >= 20) {
            return back()->withErrors(['cart' => 'Your cart is full (20 item limit). Please remove an item before adding more.']);
        }

        if ($existingItem) {
            // Don't exceed stock when incrementing an existing line
            $newQty = min($existingItem->quantity + $quantity, $variant->stock_quantity);
            $existingItem->update(['quantity' => $newQty]);
        } else {
            CartItem::create([
                'cart_id'            => $cart->id,
                'product_variant_id' => $request->product_variant_id,
                'quantity'           => $quantity,
            ]);
        }

        return back()->with('success', 'Vault updated.');
    }

    public function update(Request $request, $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1|max:99']);

        $cartItem = CartItem::with('productVariant')
            ->whereHas('cart', function ($query) {
                $query->where('user_id', Auth::id());
            })->findOrFail($id);

        // Clamp against actual stock — never allow more than what's available
        $stock    = $cartItem->productVariant?->stock_quantity ?? 0;
        $quantity = min($request->quantity, max($stock, 1));

        $cartItem->update(['quantity' => $quantity]);

        return back()->with('success', 'Vault updated.');
    }

    /**
     * Bulk-update quantities then redirect to checkout (checkout button).
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'items'              => 'required|array',
            'items.*.id'         => 'required|exists:cart_items,id',
            'items.*.quantity'   => 'required|integer|min:1|max:99',
        ]);

        foreach ($request->items as $itemData) {
            $cartItem = CartItem::with('productVariant')
                ->whereHas('cart', function ($query) {
                    $query->where('user_id', Auth::id());
                })->findOrFail($itemData['id']);

            // Clamp against actual stock
            $stock    = $cartItem->productVariant?->stock_quantity ?? 0;
            $quantity = min((int) $itemData['quantity'], max($stock, 1));

            $cartItem->update(['quantity' => $quantity]);
        }

        return redirect()->route('checkout.index');
    }

    /**
     * Bulk-save quantities in-place, no redirect (close drawer button).
     */
    public function bulkSave(Request $request)
    {
        $request->validate([
            'items'              => 'required|array',
            'items.*.id'         => 'required|exists:cart_items,id',
            'items.*.quantity'   => 'required|integer|min:1|max:99',
        ]);

        foreach ($request->items as $itemData) {
            $cartItem = CartItem::with('productVariant')
                ->whereHas('cart', function ($query) {
                    $query->where('user_id', Auth::id());
                })->findOrFail($itemData['id']);

            // Clamp against actual stock
            $stock    = $cartItem->productVariant?->stock_quantity ?? 0;
            $quantity = min((int) $itemData['quantity'], max($stock, 1));

            $cartItem->update(['quantity' => $quantity]);
        }

        return back()->with('success', 'Vault saved.');
    }

    /**
     * Remove an item from the vault entirely.
     */
    public function destroy($id)
    {
        $cartItem = CartItem::whereHas('cart', function ($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        $cartItem->delete();

        return back()->with('success', 'Item removed.');
    }
}
