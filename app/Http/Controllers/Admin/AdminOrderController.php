<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminOrderController extends Controller
{
    private const DELIVERY_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

    public function index(Request $request)
    {
        $query = Order::with(['user', 'items', 'payment'])->latest('placed_at');

        if ($status = $request->input('status')) {
            $query->where('delivery_status', $status);
        }
        if ($payment = $request->input('payment')) {
            $query->where('payment_status', $payment);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('shipping_full_name', 'like', "%{$search}%");
            });
        }

        $orders = $query->get()->map(fn($order) => [
            'id'              => $order->id,
            'order_number'    => $order->order_number,
            'customer_name'   => $order->shipping_full_name,
            'customer_email'  => $order->user?->email,
            'total_amount'    => $order->total_amount,
            'item_count'      => $order->items->sum('quantity'),
            'order_status'    => $order->order_status,
            'payment_status'  => $order->payment_status,
            'delivery_status' => $order->delivery_status,
            'payment_method'  => $order->payment?->payment_method,
            'placed_at'       => $order->placed_at?->toISOString(),
        ]);

        $stats = [
            'total'      => Order::count(),
            'pending'    => Order::where('delivery_status', 'Pending')->count(),
            'processing' => Order::where('delivery_status', 'Processing')->count(),
            'shipped'    => Order::where('delivery_status', 'Shipped')->count(),
            'delivered'  => Order::where('delivery_status', 'Delivered')->count(),
        ];

        return Inertia::render('Admin/Orders/Index', [
            'orders'  => $orders,
            'stats'   => $stats,
            'filters' => $request->only(['status', 'payment', 'search']),
            'admin'   => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function show(int $id)
    {
        $order = Order::with(['user', 'items.product', 'payment'])->findOrFail($id);

        return Inertia::render('Admin/Orders/Show', [
            'order'         => $this->formatOrder($order),
            'deliverySteps' => self::DELIVERY_STEPS,
            'admin'         => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function updateDeliveryStatus(Request $request, int $id)
    {
        $request->validate([
            'delivery_status' => ['required', 'string', 'in:' . implode(',', self::DELIVERY_STEPS)],
        ]);

        $order = Order::findOrFail($id);

        $currentIndex = array_search($order->delivery_status, self::DELIVERY_STEPS);
        $newIndex     = array_search($request->delivery_status, self::DELIVERY_STEPS);

        // Only allow moving exactly one step forward — no skipping, no going backward
        if ($newIndex !== $currentIndex + 1) {
            $next = self::DELIVERY_STEPS[$currentIndex + 1] ?? null;
            $msg  = $next
                ? "Invalid transition. Order is currently {$order->delivery_status} — the next step is {$next}."
                : "This order has already reached its final delivery status.";

            return back()->withErrors(['delivery_status' => $msg]);
        }

        $order->update(['delivery_status' => $request->delivery_status]);

        return back()->with('success', "Order {$order->order_number} updated to {$request->delivery_status}.");
    }

    public function cancel(Request $request, int $id)
    {
        $order = Order::with(['items', 'payment'])->findOrFail($id);

        // Must still be Pending
        if ($order->delivery_status !== 'Pending') {
            return back()->withErrors(['cancel' => 'This order can no longer be cancelled.']);
        }

        // Must be within 24 hours
        if ($order->placed_at->diffInHours(now()) > 24) {
            return back()->withErrors(['cancel' => 'The 24-hour cancellation window has passed.']);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|in:Fraudulent order detected,Item out of stock / fulfillment failure,Customer requested cancellation,Duplicate order,Shipping address undeliverable,Other',
            'cancellation_note'   => 'nullable|string|max:500|required_if:cancellation_reason,Other',
        ]);

        DB::transaction(function () use ($order, $request) {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    ProductVariant::where('id', $item->product_variant_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            $paymentMethod = $order->payment?->payment_method;
            $isCard        = $paymentMethod && strtolower($paymentMethod) !== 'cod';
            $newPayStatus  = $isCard ? 'Refunded' : $order->payment_status;

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

        return back()->with('success', "Order {$order->order_number} has been cancelled.");
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id'                    => $order->id,
            'order_number'          => $order->order_number,
            'total_amount'          => $order->total_amount,
            'order_status'          => $order->order_status,
            'payment_status'        => $order->payment_status,
            'delivery_status'       => $order->delivery_status,
            'placed_at'             => $order->placed_at?->toISOString(),
            'cancelled_at'          => $order->cancelled_at?->toISOString(),
            'cancellation_reason'   => $order->cancellation_reason,
            'cancellation_note'     => $order->cancellation_note,
            'customer_name'         => $order->user?->name,
            'customer_email'        => $order->user?->email,
            'shipping_full_name'    => $order->shipping_full_name,
            'shipping_phone'        => $order->shipping_phone,
            'shipping_address_line' => $order->shipping_address_line,
            'shipping_city'         => $order->shipping_city,
            'shipping_state_region' => $order->shipping_state_region,
            'shipping_postal_code'  => $order->shipping_postal_code,
            'shipping_country'      => $order->shipping_country,
            'payment_method'        => $order->payment?->payment_method,
            'payment_status_detail' => $order->payment?->payment_status,
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
