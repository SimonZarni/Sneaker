<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // ── Cached stats (5 min TTL) ──────────────────────────────────────────
        // Dashboard counts and revenue figures don't need to be real-time.
        // Caching for 5 minutes saves 8+ queries on every admin page load.
        $cached = \Illuminate\Support\Facades\Cache::remember('dashboard.stats', 300, function () {

            // Single query for all order delivery counts
            $orderRow = \App\Models\Order::selectRaw("
                COUNT(*) as total,
                SUM(delivery_status = 'Pending') as pending,
                SUM(delivery_status = 'Processing') as processing,
                SUM(delivery_status = 'Shipped') as shipped,
                SUM(delivery_status = 'Delivered') as delivered
            ")->first();

            // Single query for all revenue figures
            $revenueRow = \App\Models\Order::selectRaw("
                SUM(CASE WHEN order_status = 'Confirmed' THEN total_amount ELSE 0 END) as total,
                SUM(CASE WHEN payment_status = 'COD' AND order_status != 'Cancelled' THEN total_amount ELSE 0 END) as cod,
                SUM(CASE WHEN payment_status = 'Confirmed' AND order_status != 'Cancelled' THEN total_amount ELSE 0 END) as card
            ")->first();

            return [
                'orderStats' => [
                    'total'      => (int) ($orderRow->total      ?? 0),
                    'pending'    => (int) ($orderRow->pending    ?? 0),
                    'processing' => (int) ($orderRow->processing ?? 0),
                    'shipped'    => (int) ($orderRow->shipped    ?? 0),
                    'delivered'  => (int) ($orderRow->delivered  ?? 0),
                ],
                'revenueStats' => [
                    'total' => (float) ($revenueRow->total ?? 0),
                    'cod'   => (float) ($revenueRow->cod   ?? 0),
                    'card'  => (float) ($revenueRow->card  ?? 0),
                ],
                'totalCustomers' => \App\Models\User::count(),
                'totalProducts'  => \App\Models\Product::where('is_active', true)->count(),
            ];
        });

        $orderStats     = $cached['orderStats'];
        $revenueStats   = $cached['revenueStats'];
        $totalCustomers = $cached['totalCustomers'];
        $totalProducts  = $cached['totalProducts'];

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

        // ── 30-day daily revenue chart ────────────────────────────────────────
        $dailyRevenue = Order::select(
                DB::raw('DATE(placed_at) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->where('order_status', 'Confirmed')
            ->where('placed_at', '>=', now()->subDays(29)->startOfDay())
            ->groupBy(DB::raw('DATE(placed_at)'))
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill in all 30 days including zeros for days with no orders
        $last30Days = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $last30Days->push([
                'date'    => $date,
                'label'   => now()->subDays($i)->format('M j'),
                'revenue' => isset($dailyRevenue[$date]) ? (float) $dailyRevenue[$date]->revenue : 0,
                'orders'  => isset($dailyRevenue[$date]) ? (int)   $dailyRevenue[$date]->orders  : 0,
            ]);
        }

        // ── This week vs last week ─────────────────────────────────────────────
        $thisWeekRevenue = (float) Order::where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('total_amount');

        $lastWeekRevenue = (float) Order::where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()])
            ->sum('total_amount');

        $weekChange = $lastWeekRevenue > 0
            ? round((($thisWeekRevenue - $lastWeekRevenue) / $lastWeekRevenue) * 100, 1)
            : ($thisWeekRevenue > 0 ? 100 : 0);

        $weekStats = [
            'this_week'    => $thisWeekRevenue,
            'last_week'    => $lastWeekRevenue,
            'change_pct'   => $weekChange,
            'is_up'        => $weekChange >= 0,
        ];

        // ── Monthly revenue (last 6 months) ───────────────────────────────────
        $monthlyRevenue = Order::select(
                DB::raw('YEAR(placed_at) as year'),
                DB::raw('MONTH(placed_at) as month'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->where('order_status', 'Confirmed')
            ->where('placed_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy(DB::raw('YEAR(placed_at)'), DB::raw('MONTH(placed_at)'))
            ->orderBy('year')->orderBy('month')
            ->get()
            ->keyBy(fn($r) => $r->year . '-' . str_pad($r->month, 2, '0', STR_PAD_LEFT));

        $last6Months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $key     = now()->subMonths($i)->format('Y-m');
            $label   = now()->subMonths($i)->format('M Y');
            $last6Months->push([
                'key'     => $key,
                'label'   => $label,
                'revenue' => isset($monthlyRevenue[$key]) ? (float) $monthlyRevenue[$key]->revenue : 0,
                'orders'  => isset($monthlyRevenue[$key]) ? (int)   $monthlyRevenue[$key]->orders  : 0,
            ]);
        }

                // ── Top selling products (by units sold, confirmed orders only) ─────
        $topProducts = OrderItem::select('product_id', 'product_name', 'brand_name')
            ->selectRaw('SUM(quantity) as total_units')
            ->selectRaw('SUM(subtotal) as total_revenue')
            ->whereHas('order', fn($q) => $q->where('order_status', 'Confirmed'))
            ->groupBy('product_id', 'product_name', 'brand_name')
            ->orderByDesc('total_units')
            ->limit(8)
            ->get()
            ->map(fn($item) => [
                'product_id'    => $item->product_id,
                'product_name'  => $item->product_name,
                'brand_name'    => $item->brand_name,
                'total_units'   => (int) $item->total_units,
                'total_revenue' => (float) $item->total_revenue,
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
            'dailyRevenue'   => $last30Days->values(),
            'weekStats'      => $weekStats,
            'monthlyRevenue' => $last6Months->values(),
            'topProducts'    => $topProducts,
            'recentOrders'   => $recentOrders,
            'admin'          => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }
}
