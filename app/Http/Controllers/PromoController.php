<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\PromoCode;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromoController extends Controller
{
    /**
     * Validate a promo code and return the discount amount.
     * No side effects — uses_count is only incremented when the order is placed.
     */
    public function apply(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $user = Auth::user();

        $promo = PromoCode::where('code', strtoupper(trim($request->code)))->first();

        if (!$promo) {
            return response()->json(['valid' => false, 'error' => 'Promo code not found.'], 422);
        }

        // Re-calculate subtotal server-side from the user's current cart
        $cart = Cart::with('items.productVariant.product')
            ->where('user_id', $user->id)
            ->first();

        $subtotal = 0;
        if ($cart) {
            $subtotal = $cart->items->reduce(function ($carry, $item) {
                if (!$item->productVariant || !$item->productVariant->product) return $carry;
                $product = $item->productVariant->product;
                $price   = $item->productVariant->variant_price
                    ?? ($product->isOnSale() ? $product->sale_price : $product->base_price);
                return $carry + ($price * $item->quantity);
            }, 0);
        }

        $result = $promo->validate($subtotal, $user->id);

        if (!$result['valid']) {
            return response()->json(['valid' => false, 'error' => $result['error']], 422);
        }

        return response()->json([
            'valid'    => true,
            'code'     => $promo->code,
            'type'     => $promo->type,
            'value'    => $promo->value,
            'discount' => $result['discount'],
            'message'  => $promo->type === 'percentage'
                ? $promo->value . '% off applied!'
                : '$' . number_format($result['discount'], 2) . ' off applied!',
        ]);
    }
}
