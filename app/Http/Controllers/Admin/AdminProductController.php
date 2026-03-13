<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Color;
use App\Models\Gender;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminProductController extends Controller
{
    // ── Shared lookup data sent to every form ─────────────────────────────────
    private function formData(): array
    {
        return [
            'brands'     => Brand::orderBy('name')->get(['id', 'name']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'genders'    => Gender::orderBy('name')->get(['id', 'name']),
            'colors'     => Color::orderBy('name')->get(['id', 'name', 'hex_code']),
            'sizes'      => Size::orderBy('size_value')->get(['id', 'size_value']),
        ];
    }

    // ── INDEX ─────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Product::with(['brand', 'category', 'gender'])
            ->withCount('variants');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($brand = $request->input('brand')) {
            $query->where('brand_id', $brand);
        }
        if ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        } elseif ($request->input('status') !== 'all') {
            $query->where('is_active', true);
        }

        $products = $query->latest()->get()->map(fn($p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'brand'          => $p->brand?->name,
            'category'       => $p->category?->name,
            'gender'         => $p->gender?->name,
            'base_price'     => $p->base_price,
            'main_image_url' => $p->main_image_url,
            'is_active'      => $p->is_active,
            'variants_count' => $p->variants_count,
        ]);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'brands'   => Brand::orderBy('name')->get(['id', 'name']),
            'filters'  => $request->only(['search', 'brand', 'status']),
            'stats'    => [
                'total'    => Product::count(),
                'active'   => Product::where('is_active', true)->count(),
                'inactive' => Product::where('is_active', false)->count(),
            ],
            'admin' => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    public function create()
    {
        return Inertia::render('Admin/Products/Create', [
            ...$this->formData(),
            'admin' => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    // ── STORE ─────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'name'                            => 'required|string|max:255',
            'brand_id'                        => 'required|exists:brands,id',
            'category_id'                     => 'required|exists:categories,id',
            'gender_id'                       => 'required|exists:genders,id',
            'base_price'                      => 'required|numeric|min:0',
            'description'                     => 'nullable|string',
            'main_image_url'                  => 'nullable|url|max:2048',
            'is_active'                       => 'boolean',
            'variants'                        => 'present|array',
            'variants.*.color_id'             => 'required|exists:colors,id',
            'variants.*.image_url'            => 'nullable|url|max:2048',
            'variants.*.sizes'                => 'required|array|min:1',
            'variants.*.sizes.*.size_id'      => 'required|exists:sizes,id',
            'variants.*.sizes.*.stock_quantity' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            $adminId = Auth::guard('admin')->id();

            $product = Product::create([
                'brand_id'           => $request->brand_id,
                'category_id'        => $request->category_id,
                'gender_id'          => $request->gender_id,
                'name'               => $request->name,
                'description'        => $request->description,
                'base_price'         => $request->base_price,
                'main_image_url'     => $request->main_image_url,
                'is_active'          => $request->boolean('is_active', true),
                'created_by_admin_id' => $adminId,
                'updated_by_admin_id' => $adminId,
            ]);

            foreach ($request->variants as $variantData) {
                foreach ($variantData['sizes'] as $sizeEntry) {
                    ProductVariant::create([
                        'product_id'     => $product->id,
                        'color_id'       => $variantData['color_id'],
                        'size_id'        => $sizeEntry['size_id'],
                        'stock_quantity' => $sizeEntry['stock_quantity'],
                        'image_url'      => $variantData['image_url'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('admin.products.index')
            ->with('success', "Product \"{$request->name}\" created successfully.");
    }

    // ── EDIT ──────────────────────────────────────────────────────────────────
    public function edit(int $id)
    {
        $product = Product::with(['variants.color', 'variants.size'])->findOrFail($id);

        // Group variants by color for the UI
        $groupedVariants = $product->variants
            ->groupBy('color_id')
            ->map(function ($variants, $colorId) {
                $first = $variants->first();
                return [
                    'color_id'  => $colorId,
                    'image_url' => $first->image_url,
                    'sizes'     => $variants->map(fn($v) => [
                        'size_id'        => $v->size_id,
                        'stock_quantity' => $v->stock_quantity,
                        'variant_id'     => $v->id,
                    ])->values()->all(),
                ];
            })->values()->all();

        return Inertia::render('Admin/Products/Edit', [
            ...$this->formData(),
            'product' => [
                'id'             => $product->id,
                'name'           => $product->name,
                'brand_id'       => $product->brand_id,
                'category_id'    => $product->category_id,
                'gender_id'      => $product->gender_id,
                'base_price'     => $product->base_price,
                'description'    => $product->description,
                'main_image_url' => $product->main_image_url,
                'is_active'      => $product->is_active,
                'variants'       => $groupedVariants,
            ],
            'admin' => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    public function update(Request $request, int $id)
    {
        $request->validate([
            'name'                              => 'required|string|max:255',
            'brand_id'                          => 'required|exists:brands,id',
            'category_id'                       => 'required|exists:categories,id',
            'gender_id'                         => 'required|exists:genders,id',
            'base_price'                        => 'required|numeric|min:0',
            'description'                       => 'nullable|string',
            'main_image_url'                    => 'nullable|url|max:2048',
            'is_active'                         => 'boolean',
            'variants'                          => 'present|array',
            'variants.*.color_id'               => 'required|exists:colors,id',
            'variants.*.image_url'              => 'nullable|url|max:2048',
            'variants.*.sizes'                  => 'required|array|min:1',
            'variants.*.sizes.*.size_id'        => 'required|exists:sizes,id',
            'variants.*.sizes.*.stock_quantity' => 'required|integer|min:0',
        ]);

        $product = Product::findOrFail($id);

        DB::transaction(function () use ($request, $product) {
            $product->update([
                'brand_id'           => $request->brand_id,
                'category_id'        => $request->category_id,
                'gender_id'          => $request->gender_id,
                'name'               => $request->name,
                'description'        => $request->description,
                'base_price'         => $request->base_price,
                'main_image_url'     => $request->main_image_url,
                'is_active'          => $request->boolean('is_active', true),
                'updated_by_admin_id' => Auth::guard('admin')->id(),
            ]);

            // Delete all existing variants and re-create from submission
            // This is the simplest correct approach — avoids complex diff logic
            $product->variants()->delete();

            foreach ($request->variants as $variantData) {
                foreach ($variantData['sizes'] as $sizeEntry) {
                    ProductVariant::create([
                        'product_id'     => $product->id,
                        'color_id'       => $variantData['color_id'],
                        'size_id'        => $sizeEntry['size_id'],
                        'stock_quantity' => $sizeEntry['stock_quantity'],
                        'image_url'      => $variantData['image_url'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('admin.products.index')
            ->with('success', "Product \"{$product->name}\" updated successfully.");
    }

    // ── TOGGLE ACTIVE ─────────────────────────────────────────────────────────
    public function toggleActive(int $id)
    {
        $product = Product::findOrFail($id);
        $product->update(['is_active' => !$product->is_active]);

        $status = $product->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Product \"{$product->name}\" {$status}.");
    }

    // ── DESTROY ───────────────────────────────────────────────────────────────
    public function destroy(int $id)
    {
        $product = Product::findOrFail($id);
        $name = $product->name;
        $product->delete(); // cascade deletes variants

        return redirect()->route('admin.products.index')
            ->with('success', "Product \"{$name}\" deleted permanently.");
    }
}
