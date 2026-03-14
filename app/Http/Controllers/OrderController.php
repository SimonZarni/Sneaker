<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items'])
            ->where('user_id', Auth::id())
            ->latest('placed_at')
            ->get()
            ->map(fn($order) => [
                'id'              => $order->id,
                'order_number'    => $order->order_number,
                'total_amount'    => $order->total_amount,
                'delivery_status' => $order->delivery_status,
                'payment_status'  => $order->payment_status,
                'placed_at'       => $order->placed_at?->toISOString(),
                'item_count'      => $order->items->sum('quantity'),
            ]);

        return Inertia::render('Orders/Index', ['orders' => $orders]);
    }

    public function show(int $id)
    {
        $order = Order::with(['items.product', 'payment'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return Inertia::render('Orders/Show', [
            'order' => $this->formatOrder($order),
        ]);
    }

    public function success(int $id)
    {
        $order = Order::with(['items.product', 'payment'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return Inertia::render('Orders/Success', [
            'order' => $this->formatOrder($order),
        ]);
    }

    public function cancel(Request $request, int $id)
    {
        $order = Order::with(['items', 'payment'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Must still be Pending
        if ($order->delivery_status !== 'Pending') {
            return back()->withErrors(['cancel' => 'This order can no longer be cancelled.']);
        }

        // Must be within 24 hours
        if ($order->placed_at->diffInHours(now()) > 24) {
            return back()->withErrors(['cancel' => 'The 24-hour cancellation window has passed.']);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|in:Ordered by mistake,Changed my mind,Ordered the wrong size / color,Want to change shipping address,Ordered duplicate by mistake,Other',
            'cancellation_note'   => 'nullable|string|max:500|required_if:cancellation_reason,Other',
        ]);

        DB::transaction(function () use ($order, $request) {
            // Restore stock for each item
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    ProductVariant::where('id', $item->product_variant_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            // Determine new payment status
            $paymentMethod  = $order->payment?->payment_method;
            $isCard         = $paymentMethod && strtolower($paymentMethod) !== 'cod';
            $newPayStatus   = $isCard ? 'Refunded' : $order->payment_status;

            $order->update([
                'order_status'        => 'Cancelled',
                'delivery_status'     => 'Cancelled',
                'payment_status'      => $newPayStatus,
                'cancelled_at'        => now(),
                'cancellation_reason' => $request->cancellation_reason,
                'cancellation_note'   => $request->cancellation_note,
            ]);

            // Also update the payments table record
            if ($isCard && $order->payment) {
                $order->payment->update(['payment_status' => 'Refunded']);
            }
        });

        return back()->with('success', 'Your order has been cancelled.');
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id'                    => $order->id,
            'order_number'          => $order->order_number,
            'total_amount'          => $order->total_amount,
            'order_status'          => $order->order_status,
            'delivery_status'       => $order->delivery_status,
            'payment_status'        => $order->payment_status,
            'placed_at'             => $order->placed_at?->toISOString(),
            'cancelled_at'          => $order->cancelled_at?->toISOString(),
            'cancellation_reason'   => $order->cancellation_reason,
            'cancellation_note'     => $order->cancellation_note,
            'shipping_full_name'    => $order->shipping_full_name,
            'shipping_phone'        => $order->shipping_phone,
            'shipping_address_line' => $order->shipping_address_line,
            'shipping_city'         => $order->shipping_city,
            'shipping_state_region' => $order->shipping_state_region,
            'shipping_postal_code'  => $order->shipping_postal_code,
            'shipping_country'      => $order->shipping_country,
            'payment_method'        => $order->payment?->payment_method,
            'cardholder_name'       => $order->payment?->cardholder_name,
            'card_last4'            => $order->payment?->card_last4,
            'items'                 => $order->items->map(fn($item) => [
                'id'           => $item->id,
                'product_name' => $item->product_name,
                'brand_name'   => $item->brand_name,
                'color_name'   => $item->color_name,
                'size_value'   => $item->size_value,
                'unit_price'   => $item->unit_price,
                'quantity'     => $item->quantity,
                'subtotal'     => $item->subtotal,
                'image_url'    => $item->product?->main_image_url,
            ])->all(),
        ];
    }
}
