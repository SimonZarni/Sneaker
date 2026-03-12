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

        // 1. Fetch Cart with all specific sneaker details
        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color'
        ])->where('user_id', $user->id)->first();

        // 2. Redirect if Vault is empty
        if (!$cart || $cart->items->isEmpty()) {
            return redirect()->route('shop.index')->with('error', 'Your vault is empty.');
        }

        // 3. Fetch User's saved addresses for the "Quick Select" feature
        $savedAddresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->get();

        return Inertia::render('Shop/Checkout', [
            'cart' => $cart,
            'savedAddresses' => $savedAddresses,
        ]);
    }

    /**
     * Process the Purchase.
     */
    public function store(Request $request)
    {
        // 1. Validate Input (Mapping to your orders and user_addresses migrations)
        $validated = $request->validate([
            'shipping_full_name' => 'required|string|max:255',
            'shipping_phone' => 'required|string|max:20',
            'shipping_address_line' => 'required|string',
            'shipping_city' => 'required|string',
            'shipping_country' => 'required|string',
            'shipping_state_region' => 'nullable|string',
            'shipping_postal_code' => 'nullable|string',
            'payment_method' => 'required|string', // e.g., "Credit Card" or "Bank Transfer"
        ]);

        $user = Auth::user();

        // 2. Fetch the Cart again to calculate final price securely on the server
        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color'
        ])->where('user_id', $user->id)->firstOrFail();

        // Calculate total amount
        $totalAmount = $cart->items->reduce(function ($carry, $item) {
            // If the variant is missing, skip this item's cost
            if (!$item->product_variant || !$item->product_variant->product) {
                return $carry;
            }

            return $carry + ($item->product_variant->product->base_price * $item->quantity);
        }, 0);

        // 3. Begin Database Transaction for Safety
        return DB::transaction(function () use ($validated, $user, $cart, $totalAmount) {

            // A. Sync Address Book (Update existing or Create new)
            $userAddress = UserAddress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'address_line' => $validated['shipping_address_line'],
                    'city' => $validated['shipping_city'],
                ],
                [
                    'full_name' => $validated['shipping_full_name'],
                    'phone' => $validated['shipping_phone'],
                    'state_region' => $validated['shipping_state_region'],
                    'postal_code' => $validated['shipping_postal_code'],
                    'country' => $validated['shipping_country'],
                    'is_default' => UserAddress::where('user_id', $user->id)->count() === 0,
                ]
            );

            // B. Create the Order (Snapshot of this specific transaction)
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $userAddress->id,
                'order_number' => 'SDRP-' . strtoupper(Str::random(12)),
                'total_amount' => $totalAmount,
                'order_status' => 'Confirmed',
                'payment_status' => 'Pending',
                'delivery_status' => 'Pending',
                'shipping_full_name' => $validated['shipping_full_name'],
                'shipping_phone' => $validated['shipping_phone'],
                'shipping_address_line' => $validated['shipping_address_line'],
                'shipping_city' => $validated['shipping_city'],
                'shipping_state_region' => $validated['shipping_state_region'],
                'shipping_postal_code' => $validated['shipping_postal_code'],
                'shipping_country' => $validated['shipping_country'],
                'placed_at' => now(),
            ]);

            foreach ($cart->items as $item) {
                if (!$item->productVariant) continue;

                // 2. Insert the snapshot into order_items
                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_id'         => $item->productVariant->product_id,
                    'product_variant_id' => $item->product_variant_id,

                    // We save these as strings so they never change
                    'product_name'       => $item->productVariant->product->name,
                    'brand_name'         => $item->productVariant->product->brand->name,
                    'category_name'      => $item->productVariant->product->category->name,
                    'gender_name'        => 'Unisex', // Adjust if you have a gender column
                    'color_name'         => $item->productVariant->color->name,
                    'size_value'         => $item->productVariant->size->size_value,

                    // Financials
                    'unit_price'         => $item->productVariant->product->base_price,
                    'quantity'           => $item->quantity,
                    'subtotal'           => $item->productVariant->product->base_price * $item->quantity,
                ]);

                // 3. Decrement stock so others can't buy the same pair
                $item->productVariant->decrement('stock_quantity', $item->quantity);
            }

            // E. Create Payment Record
            Payment::create([
                'order_id' => $order->id,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'Pending',
            ]);

            // F. Clear the Vault (Cart Items)
            $cart->items()->delete();

            // Redirect back to shop or a success page
            return redirect()->route('shop.index')->with('success', "Order {$order->order_number} secured successfully.");
        });
    }
}
