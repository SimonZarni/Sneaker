<?php

namespace App\Http\Controllers\Admin;

use App\Events\OrderStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = ReturnRequest::with(['order', 'user', 'items'])
            ->latest('requested_at');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $returns = $query->paginate(20)->through(fn($r) => [
            'id'             => $r->id,
            'order_id'       => $r->order_id,
            'order_number'   => $r->order->order_number,
            'customer_name'  => $r->user->name,
            'customer_email' => $r->user->email,
            'item_count'     => $r->items->sum('quantity'),
            'status'         => $r->status,
            'refund_method'  => $r->refund_method,
            'refund_amount'  => $r->refund_amount,
            'requested_at'   => $r->requested_at?->toISOString(),
        ]);

        $stats = [
            'pending'  => ReturnRequest::where('status', 'Pending')->count(),
            'approved' => ReturnRequest::where('status', 'Approved')->count(),
            'rejected' => ReturnRequest::where('status', 'Rejected')->count(),
            'refunded' => ReturnRequest::where('status', 'Refunded')->count(),
        ];

        return Inertia::render('Admin/Returns/Index', [
            'returns' => $returns,
            'stats'   => $stats,
            'filters' => $request->only(['status']),
            'admin'   => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function show(int $id)
    {
        $returnRequest = ReturnRequest::with([
            'order.payment',
            'user',
            'items.orderItem.product',
        ])->findOrFail($id);

        return Inertia::render('Admin/Returns/Show', [
            'returnRequest' => $this->formatReturn($returnRequest),
            'admin'         => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function approve(int $id)
    {
        $returnRequest = ReturnRequest::with(['items.orderItem', 'order'])->findOrFail($id);

        if ($returnRequest->status !== 'Pending') {
            return back()->withErrors(['action' => 'Only pending returns can be approved.']);
        }

        DB::transaction(function () use ($returnRequest) {
            $refundAmount = 0;

            foreach ($returnRequest->items as $item) {
                $orderItem = $item->orderItem;
                if ($orderItem) {
                    $refundAmount += $orderItem->unit_price * $item->quantity;

                    // Restore stock
                    if ($orderItem->product_variant_id && $orderItem->product_id) {
                        ProductVariant::where('id', $orderItem->product_variant_id)
                            ->where('product_id', $orderItem->product_id)
                            ->increment('stock_quantity', $item->quantity);
                    }
                }
            }

            $returnRequest->update([
                'status'        => 'Approved',
                'refund_amount' => round($refundAmount, 2),
                'resolved_at'   => now(),
            ]);

            $returnRequest->order->update(['order_status' => 'Return Approved']);
        });

        try {
            $order = Order::with('user')->find($returnRequest->order_id);
            if ($order && $order->user) {
                broadcast(new OrderStatusChanged($order, 'return_approved'));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast return_approved', [
                'return_request_id' => $id,
                'error'             => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Return approved and stock restored.');
    }

    public function reject(Request $request, int $id)
    {
        $request->validate([
            'admin_note' => 'required|string|max:500',
        ]);

        $returnRequest = ReturnRequest::with('order')->findOrFail($id);

        if ($returnRequest->status !== 'Pending') {
            return back()->withErrors(['action' => 'Only pending returns can be rejected.']);
        }

        $returnRequest->update([
            'status'      => 'Rejected',
            'admin_note'  => $request->admin_note,
            'resolved_at' => now(),
        ]);

        $returnRequest->order->update(['order_status' => 'Confirmed']);

        try {
            $order = Order::with('user')->find($returnRequest->order_id);
            if ($order && $order->user) {
                broadcast(new OrderStatusChanged($order, 'return_rejected'));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast return_rejected', [
                'return_request_id' => $id,
                'error'             => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Return request rejected.');
    }

    public function markRefunded(int $id)
    {
        $returnRequest = ReturnRequest::with(['order.payment'])->findOrFail($id);

        if ($returnRequest->status !== 'Approved') {
            return back()->withErrors(['action' => 'Only approved returns can be marked as refunded.']);
        }

        DB::transaction(function () use ($returnRequest) {
            $returnRequest->update(['status' => 'Refunded']);

            $returnRequest->order->update([
                'order_status'   => 'Returned',
                'payment_status' => 'Refunded',
            ]);

            if ($returnRequest->order->payment) {
                $returnRequest->order->payment->update(['payment_status' => 'Refunded']);
            }
        });

        try {
            $order = Order::with('user')->find($returnRequest->order_id);
            if ($order && $order->user) {
                broadcast(new OrderStatusChanged($order, 'return_refunded'));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast return_refunded', [
                'return_request_id' => $id,
                'error'             => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Refund marked as processed.');
    }

    private function formatReturn(ReturnRequest $r): array
    {
        return [
            'id'                     => $r->id,
            'status'                 => $r->status,
            'refund_method'          => $r->refund_method,
            'refund_account_details' => $r->refund_account_details,
            'refund_amount'          => $r->refund_amount,
            'admin_note'             => $r->admin_note,
            'requested_at'           => $r->requested_at?->toISOString(),
            'resolved_at'            => $r->resolved_at?->toISOString(),
            'customer_name'          => $r->user->name,
            'customer_email'         => $r->user->email,
            'order_id'               => $r->order->id,
            'order_number'           => $r->order->order_number,
            'order_total'            => $r->order->total_amount,
            'payment_method'         => $r->order->payment?->payment_method,
            'card_last4'             => $r->order->payment?->card_last4,
            'items'                  => $r->items->map(fn($item) => [
                'id'           => $item->id,
                'quantity'     => $item->quantity,
                'reason'       => $item->reason,
                'photo_url'    => $item->photo_path ? asset('storage/' . $item->photo_path) : null,
                'product_name' => $item->orderItem?->product_name,
                'brand_name'   => $item->orderItem?->brand_name,
                'color_name'   => $item->orderItem?->color_name,
                'size_value'   => $item->orderItem?->size_value,
                'unit_price'   => $item->orderItem?->unit_price,
                'image_url'    => $item->orderItem?->product?->main_image_url,
            ])->all(),
        ];
    }
}
