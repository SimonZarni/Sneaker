<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // ── Order stats ───────────────────────────────────────────────────────
        $orderStats = [
            'total'      => Order::count(),
            'pending'    => Order::where('delivery_status', 'Pending')->count(),
            'processing' => Order::where('delivery_status', 'Processing')->count(),
            'shipped'    => Order::where('delivery_status', 'Shipped')->count(),
            'delivered'  => Order::where('delivery_status', 'Delivered')->count(),
        ];

        // ── Revenue stats ─────────────────────────────────────────────────────
        $revenueStats = [
            'total' => (float) Order::where('order_status', 'Confirmed')->sum('total_amount'),
            'cod'   => (float) Order::where('payment_status', 'COD')->sum('total_amount'),
            'card'  => (float) Order::where('payment_status', 'Confirmed')->sum('total_amount'),
        ];

        // ── Other counts ──────────────────────────────────────────────────────
        $totalCustomers = User::count();
        $totalProducts  = Product::where('is_active', true)->count();

        // ── Low stock variants (≤ 5) ──────────────────────────────────────────
        $lowStock = ProductVariant::with(['product:id,name,is_active', 'color:id,name,hex_code', 'size:id,size_value'])
            ->where('stock_quantity', '<=', 5)
            ->whereHas('product', fn($q) => $q->where('is_active', true))
            ->orderBy('stock_quantity', 'asc')
            ->get()
            ->map(fn($v) => [
                'id'             => $v->id,
                'product_id'     => $v->product_id,
                'product_name'   => $v->product->name,
                'color_name'     => $v->color->name,
                'color_hex'      => $v->color->hex_code,
                'size_value'     => $v->size->size_value,
                'stock_quantity' => $v->stock_quantity,
            ]);

        // ── 5 most recent orders ──────────────────────────────────────────────
        $recentOrders = Order::with('user')
            ->latest('placed_at')
            ->take(5)
            ->get()
            ->map(fn($o) => [
                'id'              => $o->id,
                'order_number'    => $o->order_number,
                'customer_name'   => $o->shipping_full_name,
                'total_amount'    => $o->total_amount,
                'delivery_status' => $o->delivery_status,
                'payment_status'  => $o->payment_status,
                'placed_at'       => $o->placed_at?->toISOString(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'orderStats'     => $orderStats,
            'revenueStats'   => $revenueStats,
            'totalCustomers' => $totalCustomers,
            'totalProducts'  => $totalProducts,
            'lowStock'       => $lowStock,
            'recentOrders'   => $recentOrders,
            'admin'          => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }
}
