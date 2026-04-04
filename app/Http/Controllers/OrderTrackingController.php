<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderTrackingController extends Controller
{
    public function showForm()
    {
        return Inertia::render('Track/Index', ['result' => null]);
    }

    public function track(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string|max:100',
            'email'        => 'required|email|max:255',
        ]);

        $order = Order::with(['items', 'payment'])
            ->whereHas('user', fn($q) => $q->where('email', $request->email))
            ->where('order_number', $request->order_number)
            ->first();

        if (! $order) {
            return back()->withErrors([
                'order_number' => 'No order found with that order number and email combination.',
            ])->withInput();
        }

        return Inertia::render('Track/Index', [
            'result' => $this->formatTracking($order),
        ]);
    }

    private function formatTracking(Order $order): array
    {
        return [
            'order_number'    => $order->order_number,
            'delivery_status' => $order->delivery_status,
            'payment_status'  => $order->payment_status,
            'payment_method'  => $order->payment?->payment_method,
            'placed_at'       => $order->placed_at?->toISOString(),
            'cancelled_at'    => $order->cancelled_at?->toISOString(),
            'cancellation_reason' => $order->cancellation_reason,
            'shipping_city'   => $order->shipping_city,
            'shipping_country'=> $order->shipping_country,
            'items'           => $order->items->map(fn($item) => [
                'product_name' => $item->product_name,
                'brand_name'   => $item->brand_name,
                'color_name'   => $item->color_name,
                'size_value'   => $item->size_value,
                'quantity'     => $item->quantity,
                'image_url'    => $item->product?->main_image_url,
            ])->all(),
        ];
    }
}
