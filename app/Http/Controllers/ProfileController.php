<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\UserAddress;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the full profile hub.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // ── Order Stats ───────────────────────────────────────────────────────
        $orders = Order::where('user_id', $user->id)->get();

        $orderStats = [
            'total'     => $orders->count(),
            'pending'   => $orders->whereIn('delivery_status', ['Pending', 'Processing'])->count(),
            'shipped'   => $orders->where('delivery_status', 'Shipped')->count(),
            'delivered' => $orders->where('delivery_status', 'Delivered')->count(),
            'spent'     => (float) $orders->where('order_status', 'Confirmed')->sum('total_amount'),
        ];

        // ── Recent Orders (last 5) ────────────────────────────────────────────
        $recentOrders = Order::with('items')
            ->where('user_id', $user->id)
            ->latest('placed_at')
            ->take(5)
            ->get()
            ->map(fn($o) => [
                'id'              => $o->id,
                'order_number'    => $o->order_number,
                'total_amount'    => $o->total_amount,
                'delivery_status' => $o->delivery_status,
                'payment_status'  => $o->payment_status,
                'placed_at'       => $o->placed_at?->toISOString(),
                'item_count'      => $o->items->sum('quantity'),
                'preview_name'    => $o->items->first()?->product_name ?? 'Order',
            ]);

        // ── Address Book ──────────────────────────────────────────────────────
        $addresses = UserAddress::where('user_id', $user->id)
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => session('status'),
            'orderStats'      => $orderStats,
            'recentOrders'    => $recentOrders,
            'addresses'       => $addresses,
            'profileUser'     => [
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();

        // Block deletion if the user has any non-terminal orders.
        // orders.user_id is onDelete('restrict') — deleting without this
        // guard throws a raw FK constraint error from MySQL.
        $activeOrderCount = Order::where('user_id', $user->id)
            ->whereNotIn('order_status', ['Cancelled', 'Delivered'])
            ->count();

        if ($activeOrderCount > 0) {
            return back()->withErrors([
                'password' => "Your account cannot be deleted while you have {$activeOrderCount} active " . ($activeOrderCount === 1 ? 'order' : 'orders') . '. Please wait until all orders are delivered or cancelled.',
            ]);
        }

        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    // ── Address Book actions ──────────────────────────────────────────────────

    public function storeAddress(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'full_name'    => 'required|string|max:255',
            'phone'        => 'required|string|max:20',
            'address_line' => 'required|string|max:500',
            'city'         => 'required|string|max:100',
            'state_region' => 'nullable|string|max:100',
            'postal_code'  => 'nullable|string|max:20',
            'country'      => 'required|string|max:100',
            'is_default'   => 'boolean',
        ]);

        $userId = Auth::id();

        DB::transaction(function () use ($validated, $userId) {
            // If marking as default, unset others first
            if (!empty($validated['is_default'])) {
                UserAddress::where('user_id', $userId)->update(['is_default' => false]);
            }

            // If this is the user's first address, auto-default it
            $isFirst = UserAddress::where('user_id', $userId)->count() === 0;

            UserAddress::create([
                ...$validated,
                'user_id'    => $userId,
                'is_default' => $isFirst || !empty($validated['is_default']),
            ]);
        });

        return back()->with('status', 'address-added');
    }

    public function updateAddress(Request $request, int $id): RedirectResponse
    {
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'full_name'    => 'required|string|max:255',
            'phone'        => 'required|string|max:20',
            'address_line' => 'required|string|max:500',
            'city'         => 'required|string|max:100',
            'state_region' => 'nullable|string|max:100',
            'postal_code'  => 'nullable|string|max:20',
            'country'      => 'required|string|max:100',
            'is_default'   => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            UserAddress::where('user_id', Auth::id())->update(['is_default' => false]);
        }

        // Explicitly list each field — never pass $validated directly.
        // If the frontend omits is_default (editing just name/phone), $validated
        // contains is_default=false and would silently strip the default flag.
        $address->update([
            'full_name'    => $validated['full_name'],
            'phone'        => $validated['phone'],
            'address_line' => $validated['address_line'],
            'city'         => $validated['city'],
            'state_region' => $validated['state_region'] ?? null,
            'postal_code'  => $validated['postal_code']  ?? null,
            'country'      => $validated['country'],
            // Only write is_default=true when explicitly requested
            ...(!empty($validated['is_default']) ? ['is_default' => true] : []),
        ]);

        return back()->with('status', 'address-updated');
    }

    public function destroyAddress(int $id): RedirectResponse
    {
        $address = UserAddress::where('user_id', Auth::id())->findOrFail($id);
        $wasDefault = $address->is_default;
        $address->delete();

        // Promote the next address to default if the deleted one was the default
        if ($wasDefault) {
            $next = UserAddress::where('user_id', Auth::id())->latest()->first();
            $next?->update(['is_default' => true]);
        }

        return back()->with('status', 'address-deleted');
    }

    public function setDefaultAddress(int $id): RedirectResponse
    {
        $userId = Auth::id();

        DB::transaction(function () use ($userId, $id) {
            UserAddress::where('user_id', $userId)->update(['is_default' => false]);
            UserAddress::where('user_id', $userId)->findOrFail($id)->update(['is_default' => true]);
        });

        return back()->with('status', 'address-updated');
    }
}
