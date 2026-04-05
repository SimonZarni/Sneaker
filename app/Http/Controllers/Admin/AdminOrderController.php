<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Events\OrderStatusChanged;
use App\Mail\OrderDelivered;
use App\Models\Order;
use App\Models\ProductVariant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AdminOrderController extends Controller
{
    private const DELIVERY_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

    public function index(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
        ]);

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
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('placed_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('placed_at', '<=', $dateTo);
        }

        $orders = $query->paginate(20)->through(fn($order) => [
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
            'filters' => $request->only(['status', 'payment', 'search', 'date_from', 'date_to']),
            'admin'   => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function show(int $id)
    {
        $order = Order::with(['user', 'items.product', 'payment', 'returnRequests.items', 'promoCode'])->findOrFail($id);

        return Inertia::render('Admin/Orders/Show', [
            'order'         => $this->formatOrder($order),
            'deliverySteps' => self::DELIVERY_STEPS,
            'admin'         => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function downloadInvoice(int $id)
    {
        $order = Order::with(['user', 'items.product', 'payment', 'promoCode'])->findOrFail($id);

        $data = $this->formatOrder($order);

        $total      = (float) $data['total_amount'];
        $shipping   = (float) ($data['shipping_fee'] ?? 0);
        $tax        = round($total * 0.07, 2);
        $subtotal   = round($total - $tax, 2);

        $pdf = Pdf::loadView('pdf.invoice', [
            'order'      => $data,
            'subtotal'   => $subtotal,
            'shippingFee'=> $shipping,
            'tax'        => $tax,
            'placedAt'   => $order->placed_at?->format('M j, Y'),
        ]);

        $filename = 'invoice-' . $data['order_number'] . '.pdf';
        return $pdf->download($filename);
    }

    public function updateDeliveryStatus(Request $request, int $id)
    {
        $request->validate([
            'delivery_status' => ['required', 'string', 'in:' . implode(',', self::DELIVERY_STEPS)],
        ]);

        DB::transaction(function () use ($request, $id) {
            $order = Order::where('id', $id)->lockForUpdate()->firstOrFail();

            $currentIndex = array_search($order->delivery_status, self::DELIVERY_STEPS);
            $newIndex     = array_search($request->delivery_status, self::DELIVERY_STEPS);

            if ($newIndex !== $currentIndex + 1) {
                $next = self::DELIVERY_STEPS[$currentIndex + 1] ?? null;
                $msg  = $next
                    ? "Invalid transition. Order is currently {$order->delivery_status} — the next step is {$next}."
                    : "This order has already reached its final delivery status.";

                throw \Illuminate\Validation\ValidationException::withMessages([
                    'delivery_status' => $msg,
                ]);
            }

            $updates = ['delivery_status' => $request->delivery_status];
            if ($request->delivery_status === 'Delivered') {
                $updates['delivered_at'] = now();
            }
            $order->update($updates);
        });

        // ── Broadcast real-time notification to user via Pusher ───────────────
        // Runs outside the transaction — broadcast failure never rolls back.
        try {
            $fresh = Order::with('user')->find($id);
            if ($fresh && $fresh->user) {
                $type = strtolower($request->delivery_status);
                broadcast(new OrderStatusChanged($fresh, $type));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast order status change', [
                'order_id' => $id,
                'error'    => $e->getMessage(),
            ]);
        }

        // ── Send delivered email when order reaches final Delivered state ──────
        // Runs outside the transaction — a mail failure never rolls back the status update.
        if ($request->delivery_status === 'Delivered') {
            try {
                $delivered = Order::with(['items', 'payment', 'user'])->find($id);

                if ($delivered && $delivered->user && $delivered->user->email) {
                    $domain      = substr(strrchr($delivered->user->email, '@'), 1);
                    $skipDomains = ['example.com', 'example.net', 'example.org', 'test.com', 'localhost'];
                    $deliverable = $domain && !in_array(strtolower($domain), $skipDomains) && @getmxrr($domain, $hosts);

                    if ($deliverable) {
                        Mail::to($delivered->user->email, $delivered->user->name)
                            ->send(new OrderDelivered($delivered));

                        Log::info('Order delivered email sent', [
                            'order_id' => $id,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Order delivered email failed', [
                    'order_id' => $id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        return back()->with('success', "Order updated to {$request->delivery_status}.");
    }

    public function lookup(Request $request)
    {
        $request->validate(['order_number' => 'required|string|max:100']);

        $order = Order::where('order_number', $request->order_number)->first();

        if (! $order) {
            return back()->withErrors(['order_number' => 'No order found with that number.']);
        }

        return redirect()->route('admin.orders.show', $order->id);
    }

    public function cancel(Request $request, int $id)
    {
        $order = Order::with(['items', 'payment'])->findOrFail($id);

        $request->validate([
            'cancellation_reason' => 'required|string|in:Fraudulent order detected,Item out of stock / fulfillment failure,Customer requested cancellation,Duplicate order,Shipping address undeliverable,Other',
            'cancellation_note'   => 'nullable|string|max:500|required_if:cancellation_reason,Other',
        ]);

        DB::transaction(function () use ($order, $request) {
            $fresh = Order::where('id', $order->id)
                ->lockForUpdate()
                ->first();

            if (!$fresh || $fresh->delivery_status !== 'Pending') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'cancel' => 'This order can no longer be cancelled.',
                ]);
            }

            if ($fresh->placed_at->diffInHours(now()) > 24) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'cancel' => 'The 24-hour cancellation window has passed.',
                ]);
            }

            foreach ($order->items as $item) {
                if ($item->product_variant_id && $item->product_id) {
                    ProductVariant::where('id', $item->product_variant_id)
                        ->where('product_id', $item->product_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            $paymentMethod = $fresh->payment?->payment_method;
            $isCard        = $paymentMethod && strtolower($paymentMethod) !== 'cod';
            $newPayStatus  = $isCard ? 'Refunded' : $fresh->payment_status;

            $fresh->update([
                'order_status'        => 'Cancelled',
                'delivery_status'     => 'Cancelled',
                'payment_status'      => $newPayStatus,
                'cancelled_at'        => now(),
                'cancellation_reason' => $request->cancellation_reason,
                'cancellation_note'   => $request->cancellation_note,
            ]);

            if ($isCard && $fresh->payment) {
                $fresh->payment->update(['payment_status' => 'Refunded']);
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
            'shipping_fee'          => $order->shipping_fee,
            'order_status'          => $order->order_status,
            'payment_status'        => $order->payment_status,
            'delivery_status'       => $order->delivery_status,
            'placed_at'             => $order->placed_at?->toISOString(),
            'cancelled_at'          => $order->cancelled_at?->toISOString(),
            'cancellation_reason'   => $order->cancellation_reason,
            'cancellation_note'     => $order->cancellation_note,
            'delivered_at'          => $order->delivered_at?->toISOString(),
            'return_requests'       => $order->returnRequests->map(fn($r) => [
                'id'            => $r->id,
                'status'        => $r->status,
                'refund_method' => $r->refund_method,
                'refund_amount' => $r->refund_amount,
                'item_count'    => $r->items->sum('quantity'),
                'requested_at'  => $r->requested_at?->toISOString(),
            ])->all(),
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
            'promo_code'            => $order->promoCode?->code,
            'discount_amount'       => $order->discount_amount,
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
