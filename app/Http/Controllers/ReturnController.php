<?php

namespace App\Http\Controllers;

use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\ReturnItem;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReturnController extends Controller
{
    public function store(Request $request, int $orderId)
    {
        $order = Order::with(['items', 'payment', 'returnRequests'])
            ->where('user_id', Auth::id())
            ->findOrFail($orderId);

        // Eligibility checks
        if ($order->delivery_status !== 'Delivered') {
            return back()->withErrors(['return' => 'Only delivered orders are eligible for return.']);
        }

        if (! $order->delivered_at || $order->delivered_at->diffInDays(now()) > 7) {
            return back()->withErrors(['return' => 'The 7-day return window has passed.']);
        }

        $activeReturn = $order->returnRequests()
            ->whereIn('status', ['Pending', 'Approved'])
            ->exists();

        if ($activeReturn) {
            return back()->withErrors(['return' => 'A return request is already in progress for this order.']);
        }

        $request->validate([
            'refund_method'          => 'required|string|in:Original Card,Bank Transfer,Store Credit',
            'refund_account_details' => 'nullable|string|max:500|required_if:refund_method,Bank Transfer',
            'items'                  => 'required|array|min:1',
            'items.*.order_item_id'  => 'required|integer',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.reason'         => 'required|string|max:500',
            'items.*.photo'          => 'nullable|file|image|max:5120',
        ]);

        // Validate each item belongs to this order and quantity is valid
        $orderItemsById = $order->items->keyBy('id');
        foreach ($request->items as $i => $itemData) {
            $orderItemId = (int) $itemData['order_item_id'];
            if (! $orderItemsById->has($orderItemId)) {
                return back()->withErrors(["items.{$i}.order_item_id" => 'Invalid item selected.']);
            }
            if ((int) $itemData['quantity'] > $orderItemsById[$orderItemId]->quantity) {
                return back()->withErrors(["items.{$i}.quantity" => 'Quantity exceeds the amount ordered.']);
            }
        }

        DB::transaction(function () use ($request, $order, $orderItemsById) {
            $returnRequest = ReturnRequest::create([
                'order_id'               => $order->id,
                'user_id'                => Auth::id(),
                'status'                 => 'Pending',
                'refund_method'          => $request->refund_method,
                'refund_account_details' => $request->refund_account_details,
                'requested_at'           => now(),
            ]);

            foreach ($request->items as $i => $itemData) {
                $photoPath = null;
                $photoFile = $request->file("items.{$i}.photo");
                if ($photoFile) {
                    $photoPath = $photoFile->store("return-photos/{$returnRequest->id}", 'public');
                }

                ReturnItem::create([
                    'return_request_id' => $returnRequest->id,
                    'order_item_id'     => (int) $itemData['order_item_id'],
                    'quantity'          => (int) $itemData['quantity'],
                    'reason'            => $itemData['reason'],
                    'photo_path'        => $photoPath,
                ]);
            }

            $order->update(['order_status' => 'Return Requested']);
        });

        // Broadcast notification to customer
        try {
            $fresh = Order::with('user')->find($order->id);
            if ($fresh && $fresh->user) {
                broadcast(new OrderStatusChanged($fresh, 'return_requested'));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast return_requested', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Return request submitted. We will review it within 1–2 business days.');
    }
}
