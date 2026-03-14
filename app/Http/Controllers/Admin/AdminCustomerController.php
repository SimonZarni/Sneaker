<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminCustomerController extends Controller
{
    public function index()
    {
        $customers = User::withCount('orders')
            ->withSum('orders', 'total_amount')
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'phone'        => $u->phone,
                'is_active'    => (bool) $u->is_active,
                'order_count'  => $u->orders_count,
                'total_spent'  => (float) ($u->orders_sum_total_amount ?? 0),
                'joined_at'    => $u->created_at->toISOString(),
                'last_order_at' => Order::where('user_id', $u->id)->latest()->value('placed_at')?->toISOString(),
            ]);

        $stats = [
            'total'    => $customers->count(),
            'active'   => $customers->where('is_active', true)->count(),
            'inactive' => $customers->where('is_active', false)->count(),
            'revenue'  => (float) $customers->sum('total_spent'),
        ];

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'stats'     => $stats,
            'admin'     => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function show(int $id)
    {
        $user = User::findOrFail($id);

        $orders = Order::with('items')
            ->where('user_id', $id)
            ->latest('placed_at')
            ->get()
            ->map(fn($o) => [
                'id'             => $o->id,
                'order_number'   => $o->order_number,
                'total_amount'   => $o->total_amount,
                'order_status'   => $o->order_status,
                'payment_status' => $o->payment_status,
                'delivery_status' => $o->delivery_status,
                'item_count'     => $o->items->sum('quantity'),
                'placed_at'      => $o->placed_at?->toISOString(),
            ]);

        return Inertia::render('Admin/Customers/Show', [
            'customer' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'is_active'  => (bool) $user->is_active,
                'joined_at'  => $user->created_at->toISOString(),
                'order_count' => $orders->count(),
                'total_spent' => (float) $orders->sum('total_amount'),
            ],
            'orders' => $orders,
            'admin'  => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function toggleActive(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);
        return back()->with('success', $user->is_active ? 'Customer activated.' : 'Customer deactivated.');
    }
}
