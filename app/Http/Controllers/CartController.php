<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// class CartController extends Controller
// {
//     /**
//      * Add a sneaker to the user's vault.
//      */
//     public function store(Request $request)
//     {
//         $request->validate([
//             'product_variant_id' => 'required|exists:product_variants,id',
//             'quantity' => 'nullable|integer|min:1'
//         ]);

//         $quantity = $request->input('quantity', 1);

//         // 1. Get or create the user's cart
//         $cart = Cart::firstOrCreate([
//             'user_id' => Auth::id()
//         ]);

//         // 2. Look for the item specifically
//         $cartItem = CartItem::where('cart_id', $cart->id)
//             ->where('product_variant_id', $request->product_variant_id)
//             ->first();

//         if ($cartItem) {
//             // If it exists, increment the existing quantity
//             $cartItem->increment('quantity', $quantity);
//         } else {
//             // If it's new, create it with the exact quantity (usually 1)
//             CartItem::create([
//                 'cart_id' => $cart->id,
//                 'product_variant_id' => $request->product_variant_id,
//                 'quantity' => $quantity,
//             ]);
//         }

//         return back()->with('success', 'Vault updated.');
//     }

//     public function update(Request $request, $id)
//     {
//         $request->validate([
//             'quantity' => 'required|integer|min:1'
//         ]);

//         $cartItem = CartItem::whereHas('cart', function ($query) {
//             $query->where('user_id', Auth::id());
//         })->findOrFail($id);

//         $cartItem->update([
//             'quantity' => $request->quantity
//         ]);

//         return back()->with('success', 'Vault updated.');
//     }

//     public function bulkUpdate(Request $request)
//     {
//         $request->validate([
//             'items' => 'required|array',
//             'items.*.id' => 'required|exists:cart_items,id',
//             'items.*.quantity' => 'required|integer|min:1'
//         ]);

//         foreach ($request->items as $itemData) {
//             $cartItem = CartItem::whereHas('cart', function ($query) {
//                 $query->where('user_id', Auth::id());
//             })->findOrFail($itemData['id']);

//             $cartItem->update(['quantity' => $itemData['quantity']]);
//         }

//         return redirect()->route('checkout.index'); // Redirect to checkout after saving
//     }

//     /**
//      * Remove an item from the vault entirely.
//      */
//     public function destroy($id)
//     {
//         $cartItem = CartItem::whereHas('cart', function ($query) {
//             $query->where('user_id', Auth::id());
//         })->findOrFail($id);

//         $cartItem->delete();

//         return back()->with('success', 'Item removed.');
//     }
// }

class CartController extends Controller
{
    /**
     * Add a sneaker to the user's vault.
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'nullable|integer|min:1'
        ]);

        $quantity = $request->input('quantity', 1);

        $cart = Cart::firstOrCreate(['user_id' => Auth::id()]);

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_variant_id', $request->product_variant_id)
            ->first();

        if ($cartItem) {
            $cartItem->increment('quantity', $quantity);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_variant_id' => $request->product_variant_id,
                'quantity' => $quantity,
            ]);
        }

        return back()->with('success', 'Vault updated.');
    }

    public function update(Request $request, $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);

        $cartItem = CartItem::whereHas('cart', function ($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        $cartItem->update(['quantity' => $request->quantity]);

        return back()->with('success', 'Vault updated.');
    }

    /**
     * Bulk-update quantities then redirect to checkout (checkout button).
     */
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:cart_items,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        foreach ($request->items as $itemData) {
            $cartItem = CartItem::whereHas('cart', function ($query) {
                $query->where('user_id', Auth::id());
            })->findOrFail($itemData['id']);

            $cartItem->update(['quantity' => $itemData['quantity']]);
        }

        return redirect()->route('checkout.index');
    }

    /**
     * Bulk-save quantities in-place, no redirect (close drawer button).
     */
    public function bulkSave(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:cart_items,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        foreach ($request->items as $itemData) {
            $cartItem = CartItem::whereHas('cart', function ($query) {
                $query->where('user_id', Auth::id());
            })->findOrFail($itemData['id']);

            $cartItem->update(['quantity' => $itemData['quantity']]);
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
