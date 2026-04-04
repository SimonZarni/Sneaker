<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminPromoController extends Controller
{
    public function index()
    {
        $promos = PromoCode::orderByDesc('created_at')->get();

        return Inertia::render('Admin/PromoCodes/Index', [
            'promos' => $promos,
            'admin'  => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'             => 'required|string|max:50|unique:promo_codes,code',
            'type'             => 'required|in:percentage,fixed',
            'value'            => 'required|numeric|min:0.01',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_uses'         => 'nullable|integer|min:1',
            'per_user_limit'   => 'nullable|integer|min:1',
            'starts_at'        => 'nullable|date',
            'expires_at'       => 'nullable|date|after_or_equal:starts_at',
            'is_active'        => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        // Validate percentage doesn't exceed 100
        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return back()->withErrors(['value' => 'Percentage discount cannot exceed 100%.']);
        }

        PromoCode::create($validated);

        return back()->with('success', 'Promo code created.');
    }

    public function update(Request $request, PromoCode $promo)
    {
        $validated = $request->validate([
            'code'             => 'required|string|max:50|unique:promo_codes,code,' . $promo->id,
            'type'             => 'required|in:percentage,fixed',
            'value'            => 'required|numeric|min:0.01',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_uses'         => 'nullable|integer|min:1',
            'per_user_limit'   => 'nullable|integer|min:1',
            'starts_at'        => 'nullable|date',
            'expires_at'       => 'nullable|date|after_or_equal:starts_at',
            'is_active'        => 'boolean',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return back()->withErrors(['value' => 'Percentage discount cannot exceed 100%.']);
        }

        $promo->update($validated);

        return back()->with('success', 'Promo code updated.');
    }

    public function toggle(PromoCode $promo)
    {
        $promo->update(['is_active' => !$promo->is_active]);

        return back()->with('success', $promo->is_active ? 'Promo code activated.' : 'Promo code deactivated.');
    }

    public function destroy(PromoCode $promo)
    {
        $promo->delete();

        return back()->with('success', 'Promo code deleted.');
    }
}
