<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    /**
     * Display the Checkout Page.
     */
    public function index()
    {
        $user = Auth::user();

        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color',
        ])->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return redirect()->route('shop.index')->with('error', 'Your vault is empty.');
        }

        $savedAddresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->get();

        return Inertia::render('Shop/Checkout', [
            'cart'           => $cart,
            'savedAddresses' => $savedAddresses,
        ]);
    }

    /**
     * Process the Purchase.
     */
    public function store(Request $request)
    {
        $isCard = $request->input('payment_method') === 'Credit Card';

        // ── Validation ────────────────────────────────────────────────────────
        $rules = [
            'shipping_full_name'    => 'required|string|max:255',
            'shipping_phone'        => 'required|string|max:20',
            'shipping_address_line' => 'required|string',
            'shipping_city'         => 'required|string',
            'shipping_country'      => 'required|string',
            'shipping_state_region' => 'nullable|string',
            'shipping_postal_code'  => 'nullable|string',
            'payment_method'        => 'required|in:Credit Card,COD',
        ];

        // Only require card fields when the user chose card payment
        if ($isCard) {
            $rules['cardholder_name'] = 'required|string|max:255';
            $rules['card_number']     = 'required|digits:4';      // we receive last-4 only
            $rules['card_expiry']     = ['required', 'string', 'regex:/^\d{2}\/\d{2}$/'];
            $rules['card_cvc']        = 'required|digits_between:3,4';
        }

        $validated = $request->validate($rules);

        $user = Auth::user();

        // ── Re-fetch cart server-side for secure total calculation ────────────
        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color',
        ])->where('user_id', $user->id)->firstOrFail();

        $totalAmount = $cart->items->reduce(function ($carry, $item) {
            if (!$item->productVariant || !$item->productVariant->product) {
                return $carry;
            }
            return $carry + ($item->productVariant->product->base_price * $item->quantity);
        }, 0);

        // ── Determine payment statuses ────────────────────────────────────────
        // Card  → payment confirmed immediately
        // COD   → payment status stays as "COD" (collected on delivery)
        $paymentStatus = $isCard ? 'Confirmed' : 'COD';

        // ── DB Transaction ────────────────────────────────────────────────────
        return DB::transaction(function () use ($validated, $user, $cart, $totalAmount, $isCard, $paymentStatus) {

            // A. Sync Address Book
            $userAddress = UserAddress::updateOrCreate(
                [
                    'user_id'      => $user->id,
                    'address_line' => $validated['shipping_address_line'],
                    'city'         => $validated['shipping_city'],
                ],
                [
                    'full_name'    => $validated['shipping_full_name'],
                    'phone'        => $validated['shipping_phone'],
                    'state_region' => $validated['shipping_state_region'] ?? null,
                    'postal_code'  => $validated['shipping_postal_code']  ?? null,
                    'country'      => $validated['shipping_country'],
                    'is_default'   => UserAddress::where('user_id', $user->id)->count() === 0,
                ]
            );

            // B. Create Order
            $order = Order::create([
                'user_id'               => $user->id,
                'address_id'            => $userAddress->id,
                'order_number'          => 'SDRP-' . strtoupper(Str::random(12)),
                'total_amount'          => $totalAmount,
                'order_status'          => 'Confirmed',
                'payment_status'        => $paymentStatus,
                'delivery_status'       => 'Pending',
                'shipping_full_name'    => $validated['shipping_full_name'],
                'shipping_phone'        => $validated['shipping_phone'],
                'shipping_address_line' => $validated['shipping_address_line'],
                'shipping_city'         => $validated['shipping_city'],
                'shipping_state_region' => $validated['shipping_state_region'] ?? null,
                'shipping_postal_code'  => $validated['shipping_postal_code']  ?? null,
                'shipping_country'      => $validated['shipping_country'],
                'placed_at'             => now(),
            ]);

            // C. Create Order Items + decrement stock
            foreach ($cart->items as $item) {
                if (!$item->productVariant) continue;

                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_id'         => $item->productVariant->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name'       => $item->productVariant->product->name,
                    'brand_name'         => $item->productVariant->product->brand->name,
                    'category_name'      => $item->productVariant->product->category->name,
                    'gender_name'        => $item->productVariant->product->gender->name ?? 'Unisex',
                    'color_name'         => $item->productVariant->color->name,
                    'size_value'         => $item->productVariant->size->size_value,
                    'unit_price'         => $item->productVariant->product->base_price,
                    'quantity'           => $item->quantity,
                    'subtotal'           => $item->productVariant->product->base_price * $item->quantity,
                ]);

                $item->productVariant->decrement('stock_quantity', $item->quantity);
            }

            // D. Create Payment Record
            Payment::create([
                'order_id'        => $order->id,
                'payment_method'  => $validated['payment_method'],
                'payment_status'  => $paymentStatus,
                // Store masked card details only for card payments
                'cardholder_name' => $isCard ? $validated['cardholder_name'] : null,
                'card_last4'      => $isCard ? $validated['card_number']     : null,
                'paid_at'         => $isCard ? now() : null,
            ]);

            // E. Clear the Cart
            $cart->items()->delete();

            // return redirect()->route('shop.index')
            //     ->with('success', "Order {$order->order_number} secured successfully.");
            return redirect()->route('orders.success', $order->id);
        });
    }
}
