<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminInventoryController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->input('filter', 'all'); // all | out | low | healthy
        $search = $request->input('search', '');

        $query = ProductVariant::with(['product:id,name,brand_id', 'product.brand:id,name', 'color:id,name,hex_code', 'size:id,size_value'])
            ->whereHas('product', fn($q) => $q->where('is_active', true));

        if ($search) {
            $query->whereHas('product', fn($q) => $q->where('name', 'like', "%{$search}%"));
        }

        match ($filter) {
            'out'     => $query->where('stock_quantity', 0),
            'low'     => $query->where('stock_quantity', '>', 0)->where('stock_quantity', '<=', 5),
            'healthy' => $query->where('stock_quantity', '>', 5),
            default   => null,
        };

        $variants = $query
            ->orderByRaw("CASE WHEN stock_quantity = 0 THEN 0 WHEN stock_quantity <= 5 THEN 1 ELSE 2 END")
            ->orderBy('stock_quantity')
            ->paginate(50)
            ->through(fn($v) => [
                'id'             => $v->id,
                'product_id'     => $v->product_id,
                'product_name'   => $v->product->name,
                'brand_name'     => $v->product->brand?->name ?? '—',
                'color_name'     => $v->color->name,
                'color_hex'      => $v->color->hex_code,
                'size_value'     => $v->size->size_value,
                'stock_quantity' => $v->stock_quantity,
                'variant_price'  => $v->variant_price,
            ]);

        // Summary stats
        $allVariants = ProductVariant::whereHas('product', fn($q) => $q->where('is_active', true));
        $stats = [
            'total'   => $allVariants->count(),
            'out'     => (clone $allVariants)->where('stock_quantity', 0)->count(),
            'low'     => (clone $allVariants)->where('stock_quantity', '>', 0)->where('stock_quantity', '<=', 5)->count(),
            'healthy' => (clone $allVariants)->where('stock_quantity', '>', 5)->count(),
        ];

        return Inertia::render('Admin/Inventory/Index', [
            'variants' => $variants,
            'stats'    => $stats,
            'filters'  => ['filter' => $filter, 'search' => $search],
            'admin'    => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    public function updateStock(Request $request, int $id)
    {
        $request->validate([
            'stock_quantity' => 'required|integer|min:0|max:9999',
        ]);

        $variant = ProductVariant::whereHas('product', fn($q) => $q->where('is_active', true))
            ->findOrFail($id);

        $variant->update(['stock_quantity' => $request->stock_quantity]);

        return back()->with('success', 'Stock updated.');
    }
}
