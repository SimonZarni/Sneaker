<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

// class OrderController extends Controller
// {
//     /**
//      * Display the authenticated user's order history.
//      */
//     public function index(): Response
//     {
//         $orders = Order::with(['items', 'payment'])
//             ->where('user_id', Auth::id())
//             ->latest('placed_at')
//             ->get()
//             ->map(function ($order) {
//                 return [
//                     'id'              => $order->id,
//                     'order_number'    => $order->order_number,
//                     'total_amount'    => $order->total_amount,
//                     'order_status'    => $order->order_status,
//                     'payment_status'  => $order->payment_status,
//                     'delivery_status' => $order->delivery_status,
//                     'placed_at'       => $order->placed_at?->toISOString(),
//                     'item_count'      => $order->items->sum('quantity'),
//                     // Grab the first item's product name as a preview label
//                     'preview_name'    => $order->items->first()?->product_name ?? 'Order',
//                     'payment_method'  => $order->payment?->payment_method,
//                 ];
//             });

//         return Inertia::render('Orders/Index', [
//             'orders' => $orders,
//         ]);
//     }

//     /**
//      * Display a single order's full detail.
//      */
//     public function show(int $id): Response
//     {
//         $order = Order::with(['items.product', 'payment'])
//             ->where('user_id', Auth::id())
//             ->findOrFail($id);

//         return Inertia::render('Orders/Show', [
//             'order' => [
//                 'id'                    => $order->id,
//                 'order_number'          => $order->order_number,
//                 'total_amount'          => $order->total_amount,
//                 'order_status'          => $order->order_status,
//                 'payment_status'        => $order->payment_status,
//                 'delivery_status'       => $order->delivery_status,
//                 'placed_at'             => $order->placed_at?->toISOString(),
//                 'shipping_full_name'    => $order->shipping_full_name,
//                 'shipping_phone'        => $order->shipping_phone,
//                 'shipping_address_line' => $order->shipping_address_line,
//                 'shipping_city'         => $order->shipping_city,
//                 'shipping_state_region' => $order->shipping_state_region,
//                 'shipping_postal_code'  => $order->shipping_postal_code,
//                 'shipping_country'      => $order->shipping_country,
//                 'payment_method'        => $order->payment?->payment_method,
//                 'payment_status_detail' => $order->payment?->payment_status,
//                 'items'                 => $order->items->map(function ($item) {
//                     return [
//                         'id'           => $item->id,
//                         'product_id'   => $item->product_id,
//                         'product_name' => $item->product_name,
//                         'brand_name'   => $item->brand_name,
//                         'color_name'   => $item->color_name,
//                         'size_value'   => $item->size_value,
//                         'unit_price'   => $item->unit_price,
//                         'quantity'     => $item->quantity,
//                         'subtotal'     => $item->subtotal,
//                         // Pull live image from the still-active product if available
//                         'image_url'    => $item->product?->main_image_url,
//                     ];
//                 }),
//             ],
//         ]);
//     }
// }

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

    private function formatOrder(Order $order): array
    {
        return [
            'id'                    => $order->id,
            'order_number'          => $order->order_number,
            'total_amount'          => $order->total_amount,
            'delivery_status'       => $order->delivery_status,
            'payment_status'        => $order->payment_status,
            'placed_at'             => $order->placed_at?->toISOString(),
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
