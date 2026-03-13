<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminOrderController extends Controller
{
    private const DELIVERY_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

    /**
     * List all orders with summary data, newest first.
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items', 'payment'])->latest('placed_at');

        // Filter by delivery status if provided
        if ($status = $request->input('status')) {
            $query->where('delivery_status', $status);
        }

        // Filter by payment status
        if ($payment = $request->input('payment')) {
            $query->where('payment_status', $payment);
        }

        // Search by order number or customer name
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

        // Stats for the dashboard header
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

    /**
     * Show a single order's full detail for the admin.
     */
    public function show(int $id)
    {
        $order = Order::with(['user', 'items.product', 'payment'])->findOrFail($id);

        return Inertia::render('Admin/Orders/Show', [
            'order'          => $this->formatOrder($order),
            'deliverySteps'  => self::DELIVERY_STEPS,
            'admin'          => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    /**
     * Update the delivery_status of an order.
     * Only allows moving forward through the defined steps.
     */
    public function updateDeliveryStatus(Request $request, int $id)
    {
        $request->validate([
            'delivery_status' => ['required', 'string', 'in:' . implode(',', self::DELIVERY_STEPS)],
        ]);

        $order = Order::findOrFail($id);
        $order->update(['delivery_status' => $request->delivery_status]);

        return back()->with('success', "Order {$order->order_number} updated to {$request->delivery_status}.");
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
