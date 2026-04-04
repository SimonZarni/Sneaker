<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', '30d');

        [$from, $to] = $this->periodRange($period);

        // ── KPIs ─────────────────────────────────────────────────────────────
        $confirmed = Order::where('order_status', 'Confirmed')->whereBetween('placed_at', [$from, $to]);
        $all       = Order::whereBetween('placed_at', [$from, $to]);

        $revenue        = (float) (clone $confirmed)->sum('total_amount');
        $orderCount     = (int)   (clone $confirmed)->count();
        $aov            = $orderCount > 0 ? round($revenue / $orderCount, 2) : 0;
        $shippingRev    = (float) (clone $confirmed)->sum('shipping_fee');
        $cancelledCount = (int)   (clone $all)->where('order_status', 'Cancelled')->count();
        $totalCount     = (int)   (clone $all)->count();
        $cancelRate     = $totalCount > 0 ? round(($cancelledCount / $totalCount) * 100, 1) : 0;

        $unitsSold = (int) OrderItem::whereHas(
            'order',
            fn($q) => $q->where('order_status', 'Confirmed')->whereBetween('placed_at', [$from, $to])
        )->sum('quantity');

        // Customers who placed their first-ever order within this period
        $newCustomers = User::whereHas('orders', fn($q) => $q->whereBetween('placed_at', [$from, $to]))
            ->whereDoesntHave('orders', fn($q) => $q->where('placed_at', '<', $from))
            ->count();

        $kpis = [
            'revenue'           => $revenue,
            'orders'            => $orderCount,
            'aov'               => $aov,
            'units_sold'        => $unitsSold,
            'cancellation_rate' => $cancelRate,
            'shipping_revenue'  => $shippingRev,
            'new_customers'     => $newCustomers,
        ];

        // ── Revenue chart (daily for 30d, monthly for longer ranges) ─────────
        $revenueChart = $period === '30d'
            ? $this->dailyChart($from, $to)
            : $this->monthlyChart($from, $to);

        // ── Breakdown by dimension ────────────────────────────────────────────
        $byCategory = $this->breakdownByField('category_name', $from, $to);
        $byBrand    = $this->breakdownByField('brand_name',    $from, $to);
        $byGender   = $this->breakdownByField('gender_name',   $from, $to);
        $bySize     = $this->unitsByField('size_value',  $from, $to, 10);
        $byColor    = $this->unitsByField('color_name',  $from, $to, 10);

        // ── Top 10 customers by revenue ───────────────────────────────────────
        $topCustomers = Order::select('user_id')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('COUNT(*) as order_count')
            ->selectRaw('MAX(placed_at) as last_order_at')
            ->with('user:id,name,email')
            ->where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [$from, $to])
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(fn($o) => [
                'user_id'       => $o->user_id,
                'name'          => $o->user?->name          ?? 'Deleted User',
                'email'         => $o->user?->email         ?? '—',
                'order_count'   => (int)   $o->order_count,
                'total_revenue' => (float) $o->total_revenue,
                'last_order_at' => $o->last_order_at,
            ]);

        // ── Payment method split ──────────────────────────────────────────────
        $byPayment = Order::select('payment_status')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(total_amount) as revenue')
            ->where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [$from, $to])
            ->groupBy('payment_status')
            ->get()
            ->map(fn($r) => [
                'method'  => $r->payment_status,
                'orders'  => (int)   $r->orders,
                'revenue' => (float) $r->revenue,
            ]);

        // ── Peak day-of-week ──────────────────────────────────────────────────
        $dowRows = Order::select(DB::raw('DAYOFWEEK(placed_at) as day_num'))
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(total_amount) as revenue')
            ->where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [$from, $to])
            ->groupBy(DB::raw('DAYOFWEEK(placed_at)'))
            ->orderBy('day_num')
            ->get()
            ->keyBy('day_num');

        $days        = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $byDayOfWeek = collect(range(1, 7))->map(fn($i) => [
            'day'     => $days[$i - 1],
            'orders'  => isset($dowRows[$i]) ? (int)   $dowRows[$i]->orders  : 0,
            'revenue' => isset($dowRows[$i]) ? (float) $dowRows[$i]->revenue : 0,
        ])->values();

        // ── 12-month growth table (always fixed, not affected by period) ──────
        $monthlyGrowth = $this->monthlyGrowth();

        return Inertia::render('Admin/Analytics', [
            'period'        => $period,
            'kpis'          => $kpis,
            'revenueChart'  => $revenueChart,
            'byCategory'    => $byCategory,
            'byBrand'       => $byBrand,
            'byGender'      => $byGender,
            'bySize'        => $bySize,
            'byColor'       => $byColor,
            'topCustomers'  => $topCustomers,
            'byPayment'     => $byPayment,
            'byDayOfWeek'   => $byDayOfWeek,
            'monthlyGrowth' => $monthlyGrowth,
            'admin'         => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function periodRange(string $period): array
    {
        return match ($period) {
            '3m'    => [now()->subMonths(3)->startOfDay(),  now()->endOfDay()],
            '6m'    => [now()->subMonths(6)->startOfDay(),  now()->endOfDay()],
            '12m'   => [now()->subMonths(12)->startOfDay(), now()->endOfDay()],
            'ytd'   => [now()->startOfYear(),               now()->endOfDay()],
            default => [now()->subDays(29)->startOfDay(),   now()->endOfDay()], // 30d
        };
    }

    private function dailyChart(Carbon $from, Carbon $to): array
    {
        $rows = Order::select(DB::raw('DATE(placed_at) as date'))
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('COUNT(*) as orders')
            ->where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [$from, $to])
            ->groupBy(DB::raw('DATE(placed_at)'))
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $days   = (int) $from->diffInDays($to) + 1;
        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $date     = $from->copy()->addDays($i)->format('Y-m-d');
            $result[] = [
                'label'   => $from->copy()->addDays($i)->format('M j'),
                'revenue' => isset($rows[$date]) ? (float) $rows[$date]->revenue : 0,
                'orders'  => isset($rows[$date]) ? (int)   $rows[$date]->orders  : 0,
            ];
        }
        return $result;
    }

    private function monthlyChart(Carbon $from, Carbon $to): array
    {
        $rows = Order::select(DB::raw('YEAR(placed_at) as year'), DB::raw('MONTH(placed_at) as month'))
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('COUNT(*) as orders')
            ->where('order_status', 'Confirmed')
            ->whereBetween('placed_at', [$from, $to])
            ->groupBy(DB::raw('YEAR(placed_at)'), DB::raw('MONTH(placed_at)'))
            ->orderBy('year')->orderBy('month')
            ->get()
            ->keyBy(fn($r) => $r->year . '-' . str_pad($r->month, 2, '0', STR_PAD_LEFT));

        $months = (int) $from->diffInMonths($to) + 1;
        $result = [];
        for ($i = 0; $i < $months; $i++) {
            $d        = $from->copy()->startOfMonth()->addMonths($i);
            $key      = $d->format('Y-m');
            $result[] = [
                'label'   => $d->format('M Y'),
                'revenue' => isset($rows[$key]) ? (float) $rows[$key]->revenue : 0,
                'orders'  => isset($rows[$key]) ? (int)   $rows[$key]->orders  : 0,
            ];
        }
        return $result;
    }

    private function breakdownByField(string $field, Carbon $from, Carbon $to): array
    {
        return OrderItem::select($field)
            ->selectRaw('SUM(subtotal) as revenue')
            ->selectRaw('SUM(quantity) as units')
            ->selectRaw('COUNT(DISTINCT order_id) as orders')
            ->whereHas('order', fn($q) => $q->where('order_status', 'Confirmed')->whereBetween('placed_at', [$from, $to]))
            ->whereNotNull($field)
            ->where($field, '!=', '')
            ->groupBy($field)
            ->orderByDesc('revenue')
            ->get()
            ->map(fn($r) => [
                'name'    => $r->$field,
                'revenue' => (float) $r->revenue,
                'units'   => (int)   $r->units,
                'orders'  => (int)   $r->orders,
            ])
            ->toArray();
    }

    private function unitsByField(string $field, Carbon $from, Carbon $to, int $limit = 10): array
    {
        return OrderItem::select($field)
            ->selectRaw('SUM(quantity) as units')
            ->selectRaw('SUM(subtotal) as revenue')
            ->whereHas('order', fn($q) => $q->where('order_status', 'Confirmed')->whereBetween('placed_at', [$from, $to]))
            ->whereNotNull($field)
            ->where($field, '!=', '')
            ->groupBy($field)
            ->orderByDesc('units')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'name'    => $r->$field,
                'units'   => (int)   $r->units,
                'revenue' => (float) $r->revenue,
            ])
            ->toArray();
    }

    private function monthlyGrowth(): array
    {
        $rows = Order::select(DB::raw('YEAR(placed_at) as year'), DB::raw('MONTH(placed_at) as month'))
            ->selectRaw('SUM(total_amount) as revenue')
            ->selectRaw('COUNT(*) as orders')
            ->where('order_status', 'Confirmed')
            ->where('placed_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy(DB::raw('YEAR(placed_at)'), DB::raw('MONTH(placed_at)'))
            ->orderBy('year')->orderBy('month')
            ->get()
            ->keyBy(fn($r) => $r->year . '-' . str_pad($r->month, 2, '0', STR_PAD_LEFT));

        $result      = [];
        $prevRevenue = null;
        for ($i = 11; $i >= 0; $i--) {
            $d          = now()->subMonths($i);
            $key        = $d->format('Y-m');
            $revenue    = isset($rows[$key]) ? (float) $rows[$key]->revenue : 0;
            $orders     = isset($rows[$key]) ? (int)   $rows[$key]->orders  : 0;
            $changePct  = null;
            if ($prevRevenue !== null) {
                $changePct = $prevRevenue > 0
                    ? round((($revenue - $prevRevenue) / $prevRevenue) * 100, 1)
                    : ($revenue > 0 ? 100.0 : 0.0);
            }
            $result[]    = [
                'label'      => $d->format('M Y'),
                'revenue'    => $revenue,
                'orders'     => $orders,
                'change_pct' => $changePct,
                'is_current' => $i === 0,
            ];
            $prevRevenue = $revenue;
        }
        return $result;
    }
}
