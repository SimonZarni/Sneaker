<?php

namespace App\Http\Controllers;

use App\Events\NewOrderPlaced;
use App\Events\OrderStatusChanged;
use App\Mail\OrderConfirmation;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PromoCode;
use App\Models\Setting;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Stripe\Exception\ApiErrorException;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class CheckoutController extends Controller
{
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

        $checkoutItemIds = session()->pull('checkout_item_ids');
        if ($checkoutItemIds) {
            $cart->setRelation(
                'items',
                $cart->items->filter(fn($item) => in_array($item->id, $checkoutItemIds))->values()
            );
        }

        if ($cart->items->isEmpty()) {
            return redirect()->route('shop.index')->with('error', 'Selected items are no longer in your vault.');
        }

        $savedAddresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->get();

        $cart->items->each(function ($item) {
            $product = $item->productVariant?->product;
            if ($product) {
                $product->setAttribute('is_on_sale',      $product->isOnSale());
                $product->setAttribute('effective_price', $product->effectivePrice());
            }
        });

        $shippingFee = (float) Setting::get('shipping_fee', '0.00');

        return Inertia::render('Shop/Checkout', [
            'cart'            => $cart,
            'savedAddresses'  => $savedAddresses,
            'shippingFee'     => $shippingFee,
            'checkoutItemIds' => $checkoutItemIds ?? null,
            'stripeKey'       => config('services.stripe.key'),
        ]);
    }

    /**
     * Step 1 of checkout:
     * - Validates shipping fields and calculates totals server-side.
     * - COD: creates the order immediately, returns JSON { redirect }.
     * - Card: creates an unconfirmed PaymentIntent, stores order data in session,
     *         returns JSON { client_secret } for the frontend to call confirmPayment.
     */
    public function createIntent(Request $request)
    {
        $isCard = $request->input('payment_method') === 'Credit Card';

        $validated = $request->validate([
            'shipping_full_name'    => 'required|string|max:255',
            'shipping_phone'        => 'required|string|max:20',
            'shipping_address_line' => 'required|string',
            'shipping_city'         => 'required|string',
            'shipping_country'      => 'required|string',
            'shipping_state_region' => 'nullable|string',
            'shipping_postal_code'  => 'nullable|string',
            'payment_method'        => 'required|in:Credit Card,COD',
            'checkout_item_ids'     => 'nullable|array',
            'checkout_item_ids.*'   => 'integer',
            'promo_code'            => 'nullable|string|max:50',
        ]);

        $user = Auth::user();

        // Re-fetch cart server-side
        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color',
        ])->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Your cart is empty.'], 422);
        }

        $checkoutItemIds = $validated['checkout_item_ids'] ?? null;
        if ($checkoutItemIds) {
            $cart->setRelation(
                'items',
                $cart->items->filter(fn($item) => in_array($item->id, $checkoutItemIds))->values()
            );
        }

        if ($cart->items->isEmpty()) {
            return response()->json(['message' => 'Selected items are no longer in your vault.'], 422);
        }

        // ── Calculate totals ──────────────────────────────────────────────────
        $subtotal = $cart->items->reduce(function ($carry, $item) {
            if (!$item->productVariant || !$item->productVariant->product) return $carry;
            $product = $item->productVariant->product;
            $price   = $item->productVariant->variant_price
                ?? ($product->isOnSale() ? $product->sale_price : $product->base_price);
            return $carry + ($price * $item->quantity);
        }, 0);

        $shippingFee    = (float) Setting::get('shipping_fee', '0.00');
        $discountAmount = 0.0;
        $promoCodeModel = null;

        if (!empty($validated['promo_code'])) {
            $promoCodeModel = PromoCode::where('code', strtoupper(trim($validated['promo_code'])))->first();
            if ($promoCodeModel) {
                $promoResult = $promoCodeModel->validate($subtotal, $user->id);
                if ($promoResult['valid']) {
                    $discountAmount = $promoResult['discount'];
                }
            }
        }

        $totalAmount = max(0, $subtotal + $shippingFee - $discountAmount);

        // ── COD: create order immediately ────────────────────────────────────
        if (!$isCard) {
            // Idempotency guard
            $recentOrder = Order::where('user_id', $user->id)
                ->where('placed_at', '>=', now()->subSeconds(30))
                ->latest('placed_at')
                ->first();

            if ($recentOrder) {
                return response()->json(['redirect' => route('orders.show', $recentOrder->id)]);
            }

            try {
                $order = $this->createOrder(
                    $validated, $user, $cart, $subtotal, $totalAmount,
                    $shippingFee, $discountAmount, $promoCodeModel,
                    false, 'COD', null
                );
            } catch (\Illuminate\Validation\ValidationException $e) {
                return response()->json(['errors' => $e->errors()], 422);
            }

            $this->afterOrder($order, $user, $promoCodeModel);

            return response()->json(['redirect' => route('orders.success', $order->id)]);
        }

        // ── Card: create unconfirmed PaymentIntent ───────────────────────────
        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $intent = PaymentIntent::create([
                'amount'                     => (int) round($totalAmount * 100),
                'currency'                   => 'usd',
                'automatic_payment_methods'  => ['enabled' => true],
                'metadata'                   => [
                    'user_id' => $user->id,
                    'email'   => $user->email,
                ],
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe PaymentIntent create error', ['error' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 422);
        }

        // Store pending order data in session — consumed by finalizeOrder or returnFromStripe
        session([
            'stripe_pending' => [
                'payment_intent_id' => $intent->id,
                'validated'         => $validated,
                'subtotal'          => $subtotal,
                'total_amount'      => $totalAmount,
                'shipping_fee'      => $shippingFee,
                'discount_amount'   => $discountAmount,
                'promo_code_id'     => $promoCodeModel?->id,
                'checkout_item_ids' => $checkoutItemIds,
            ],
        ]);

        return response()->json(['client_secret' => $intent->client_secret]);
    }

    /**
     * Step 2 (card, no-redirect path):
     * Called after stripe.confirmPayment() resolves inline with status "succeeded".
     * Verifies the PaymentIntent on Stripe's side, then creates the order.
     */
    public function finalizeOrder(Request $request)
    {
        $request->validate(['payment_intent_id' => 'required|string']);

        $pending = session('stripe_pending');

        if (!$pending || $pending['payment_intent_id'] !== $request->payment_intent_id) {
            return response()->json(['error' => 'Invalid or expired session.'], 422);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $intent = PaymentIntent::retrieve($request->payment_intent_id);

            if ($intent->status !== 'succeeded') {
                return response()->json(['error' => 'Payment not completed.'], 422);
            }
        } catch (ApiErrorException $e) {
            Log::error('Stripe finalizeOrder error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 422);
        }

        // Consume session before creating the order (prevents double-submission)
        session()->forget('stripe_pending');

        $user = Auth::user();

        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color',
        ])->where('user_id', $user->id)->first();

        if ($pending['checkout_item_ids']) {
            $cart->setRelation(
                'items',
                $cart->items->filter(fn($item) => in_array($item->id, $pending['checkout_item_ids']))->values()
            );
        }

        $promoCodeModel = $pending['promo_code_id']
            ? PromoCode::find($pending['promo_code_id'])
            : null;

        try {
            $order = $this->createOrder(
                $pending['validated'], $user, $cart,
                $pending['subtotal'], $pending['total_amount'],
                $pending['shipping_fee'], $pending['discount_amount'],
                $promoCodeModel, true, 'Confirmed', $request->payment_intent_id
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        $this->afterOrder($order, $user, $promoCodeModel);

        return response()->json(['redirect' => route('orders.success', $order->id)]);
    }

    /**
     * Step 2 (card, redirect path):
     * Called by Stripe after a 3DS redirect. Reads the payment_intent from the
     * query string, verifies it succeeded, then creates the order from session.
     */
    public function returnFromStripe(Request $request)
    {
        $paymentIntentId = $request->query('payment_intent');
        $redirectStatus  = $request->query('redirect_status');

        if (!$paymentIntentId || $redirectStatus !== 'succeeded') {
            return redirect()->route('checkout.index')
                ->with('error', 'Payment was not completed. Please try again.');
        }

        $pending = session('stripe_pending');

        if (!$pending || $pending['payment_intent_id'] !== $paymentIntentId) {
            return redirect()->route('checkout.index')
                ->with('error', 'Session expired. Please try again.');
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $intent = PaymentIntent::retrieve($paymentIntentId);

            if ($intent->status !== 'succeeded') {
                return redirect()->route('checkout.index')
                    ->with('error', 'Payment not confirmed by Stripe.');
            }
        } catch (ApiErrorException $e) {
            Log::error('Stripe returnFromStripe error', ['error' => $e->getMessage()]);
            return redirect()->route('checkout.index')->with('error', $e->getMessage());
        }

        // Consume session before creating the order
        session()->forget('stripe_pending');

        $user = Auth::user();

        $cart = Cart::with([
            'items.productVariant.product.brand',
            'items.productVariant.product.category',
            'items.productVariant.size',
            'items.productVariant.color',
        ])->where('user_id', $user->id)->first();

        if ($pending['checkout_item_ids']) {
            $cart->setRelation(
                'items',
                $cart->items->filter(fn($item) => in_array($item->id, $pending['checkout_item_ids']))->values()
            );
        }

        $promoCodeModel = $pending['promo_code_id']
            ? PromoCode::find($pending['promo_code_id'])
            : null;

        try {
            $order = $this->createOrder(
                $pending['validated'], $user, $cart,
                $pending['subtotal'], $pending['total_amount'],
                $pending['shipping_fee'], $pending['discount_amount'],
                $promoCodeModel, true, 'Confirmed', $paymentIntentId
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->route('checkout.index')
                ->with('error', implode(' ', Arr::flatten($e->errors())));
        }

        $this->afterOrder($order, $user, $promoCodeModel);

        return redirect()->route('orders.success', $order->id);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function createOrder(
        array $validated,
        $user,
        $cart,
        float $subtotal,
        float $totalAmount,
        float $shippingFee,
        float $discountAmount,
        $promoCodeModel,
        bool $isCard,
        string $paymentStatus,
        ?string $stripePaymentIntentId
    ): Order {
        return DB::transaction(function () use (
            $validated, $user, $cart, $subtotal, $totalAmount,
            $shippingFee, $discountAmount, $promoCodeModel,
            $isCard, $paymentStatus, $stripePaymentIntentId
        ) {
            // A. Stock validation with row-level locks
            $stockErrors = [];
            foreach ($cart->items as $item) {
                if (!$item->productVariant) continue;

                $variant = \App\Models\ProductVariant::with('product')
                    ->lockForUpdate()
                    ->find($item->product_variant_id);

                $name  = optional($item->productVariant->product)->name ?? 'Item';
                $color = optional($item->productVariant->color)->name   ?? '';
                $size  = optional($item->productVariant->size)->size_value ?? '';

                if (!$variant || !$variant->product || !$variant->product->is_active) {
                    $stockErrors[] = "{$name} ({$color} / {$size}) is no longer available.";
                    continue;
                }

                if ($variant->stock_quantity < $item->quantity) {
                    $available     = $variant->stock_quantity;
                    $stockErrors[] = "{$name} ({$color} / {$size}): "
                        . "you requested {$item->quantity} but only {$available} "
                        . ($available === 1 ? 'is' : 'are') . ' in stock.';
                }
            }

            if (!empty($stockErrors)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'stock' => $stockErrors,
                ]);
            }

            // B. Sync Address Book
            $isFirstAddress = UserAddress::where('user_id', $user->id)->count() === 0;

            $userAddress = UserAddress::updateOrCreate(
                [
                    'user_id'      => $user->id,
                    'address_line' => $validated['shipping_address_line'],
                    'city'         => $validated['shipping_city'],
                ],
                array_filter([
                    'full_name'    => $validated['shipping_full_name'],
                    'phone'        => $validated['shipping_phone'],
                    'state_region' => $validated['shipping_state_region'] ?? null,
                    'postal_code'  => $validated['shipping_postal_code']  ?? null,
                    'country'      => $validated['shipping_country'],
                    'is_default'   => $isFirstAddress ?: null,
                ], fn($v) => $v !== null)
            );

            // C. Create Order
            $order = Order::create([
                'user_id'               => $user->id,
                'address_id'            => $userAddress->id,
                'order_number'          => $this->generateOrderNumber(),
                'total_amount'          => $totalAmount,
                'shipping_fee'          => $shippingFee,
                'promo_code_id'         => $promoCodeModel?->id,
                'discount_amount'       => $discountAmount,
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

            // D. Create Order Items + decrement stock
            foreach ($cart->items as $item) {
                if (!$item->productVariant) continue;

                $product   = $item->productVariant->product;
                $unitPrice = $item->productVariant->variant_price
                    ?? ($product->isOnSale() ? $product->sale_price : $product->base_price);

                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_id'         => $item->productVariant->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name'       => $item->productVariant->product->name,
                    'brand_name'         => $item->productVariant->product->brand?->name    ?? '',
                    'category_name'      => $item->productVariant->product->category?->name ?? '',
                    'gender_name'        => $item->productVariant->product->gender?->name   ?? 'Unisex',
                    'color_name'         => $item->productVariant->color->name,
                    'size_value'         => $item->productVariant->size->size_value,
                    'unit_price'         => $unitPrice,
                    'quantity'           => $item->quantity,
                    'subtotal'           => $unitPrice * $item->quantity,
                ]);

                $item->productVariant->decrement('stock_quantity', $item->quantity);
            }

            // E. Create Payment Record
            Payment::create([
                'order_id'                 => $order->id,
                'payment_method'           => $validated['payment_method'],
                'payment_status'           => $paymentStatus,
                'cardholder_name'          => null,
                'card_last4'               => null,
                'paid_at'                  => $isCard ? now() : null,
                'stripe_payment_intent_id' => $stripePaymentIntentId,
            ]);

            // F. Remove checked-out items from cart
            $cart->items()->whereIn('id', $cart->items->pluck('id'))->delete();

            return $order;
        });
    }

    private function afterOrder(Order $order, $user, $promoCodeModel): void
    {
        if ($promoCodeModel) {
            $promoCodeModel->increment('uses_count');
        }

        \Illuminate\Support\Facades\Cache::forget('dashboard.stats');

        try {
            broadcast(new OrderStatusChanged($order, 'confirmed'));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast order confirmed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
        }

        try {
            broadcast(new NewOrderPlaced($order));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast new order to admin', ['order_id' => $order->id, 'error' => $e->getMessage()]);
        }

        try {
            $freshOrder  = Order::with(['items', 'payment'])->find($order->id);
            $deliverable = $this->emailLikelyDeliverable($user->email);

            if ($freshOrder && $deliverable) {
                Mail::to($user->email, $user->name)->send(new OrderConfirmation($freshOrder));
            }
        } catch (\Throwable $e) {
            Log::warning('Order confirmation email failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
        }
    }

    private function emailLikelyDeliverable(string $email): bool
    {
        $domain = substr(strrchr($email, '@'), 1);
        if (!$domain) return false;

        $skipDomains = ['example.com', 'example.net', 'example.org', 'test.com', 'localhost'];
        if (in_array(strtolower($domain), $skipDomains)) return false;

        return (bool) @getmxrr($domain, $mxhosts);
    }

    private function generateOrderNumber(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        do {
            $suffix = '';
            for ($i = 0; $i < 12; $i++) {
                $suffix .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $number = 'SDRP-' . $suffix;
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
