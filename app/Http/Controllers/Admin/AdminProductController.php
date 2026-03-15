<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Color;
use App\Models\Gender;
use App\Models\OrderItem;
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
            'variants.*.variant_price'        => 'nullable|numeric|min:0',
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
                        'variant_price'  => isset($variantData['variant_price']) && $variantData['variant_price'] !== '' ? $variantData['variant_price'] : null,
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
                    'color_id'      => $colorId,
                    'image_url'     => $first->image_url,
                    'variant_price' => $first->variant_price,
                    'sizes'         => $variants->map(fn($v) => [
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
            'variants.*.variant_price'          => 'nullable|numeric|min:0',
            'variants.*.image_url'              => 'nullable|url|max:2048',
            'variants.*.sizes'                  => 'required|array|min:1',
            'variants.*.sizes.*.size_id'        => 'required|exists:sizes,id',
            'variants.*.sizes.*.stock_quantity' => 'required|integer|min:0',
            'variants.*.sizes.*.variant_id'     => 'nullable|integer|exists:product_variants,id',
        ]);

        $product = Product::findOrFail($id);

        DB::transaction(function () use ($request, $product) {
            $product->update([
                'brand_id'            => $request->brand_id,
                'category_id'         => $request->category_id,
                'gender_id'           => $request->gender_id,
                'name'                => $request->name,
                'description'         => $request->description,
                'base_price'          => $request->base_price,
                'main_image_url'      => $request->main_image_url,
                'is_active'           => $request->boolean('is_active', true),
                'updated_by_admin_id' => Auth::guard('admin')->id(),
            ]);

            // ── Diff variants instead of delete+recreate ──────────────────────
            // This preserves existing variant IDs so cart_items FKs are never
            // broken by a simple edit (e.g. adding a price, updating stock).
            // Only variants that were genuinely removed get deleted.

            $variantPrice = fn($data) => isset($data['variant_price']) && $data['variant_price'] !== ''
                ? $data['variant_price']
                : null;

            // Collect the variant IDs submitted by the form (existing rows only)
            $submittedVariantIds = [];

            foreach ($request->variants as $variantData) {
                foreach ($variantData['sizes'] as $sizeEntry) {
                    if (!empty($sizeEntry['variant_id'])) {
                        // Existing variant — update in place, no delete needed
                        $submittedVariantIds[] = $sizeEntry['variant_id'];

                        ProductVariant::where('id', $sizeEntry['variant_id'])
                            ->where('product_id', $product->id) // safety: ensure it belongs to this product
                            ->update([
                                'color_id'       => $variantData['color_id'],
                                'size_id'        => $sizeEntry['size_id'],
                                'stock_quantity' => $sizeEntry['stock_quantity'],
                                'variant_price'  => $variantPrice($variantData),
                                'image_url'      => $variantData['image_url'] ?? null,
                            ]);
                    } else {
                        // New variant row — create and record its new ID
                        $newVariant = ProductVariant::create([
                            'product_id'     => $product->id,
                            'color_id'       => $variantData['color_id'],
                            'size_id'        => $sizeEntry['size_id'],
                            'stock_quantity' => $sizeEntry['stock_quantity'],
                            'variant_price'  => $variantPrice($variantData),
                            'image_url'      => $variantData['image_url'] ?? null,
                        ]);
                        $submittedVariantIds[] = $newVariant->id;
                    }
                }
            }

            // Delete only variants that were not in the submitted form
            // (i.e. the admin explicitly removed them)
            $product->variants()
                ->whereNotIn('id', $submittedVariantIds)
                ->delete();
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

        // Block deletion if there are live (non-terminal) orders containing this product
        $activeOrderCount = \App\Models\OrderItem::where('product_id', $id)
            ->whereHas('order', fn($q) => $q->whereNotIn('order_status', ['Cancelled', 'Delivered']))
            ->count();

        if ($activeOrderCount > 0) {
            return back()->withErrors([
                'delete' => "Cannot delete \"{$product->name}\" — it appears in {$activeOrderCount} active order(s). Deactivate it instead.",
            ]);
        }

        $name = $product->name;
        $product->delete(); // cascade deletes variants

        return redirect()->route('admin.products.index')
            ->with('success', "Product \"{$name}\" deleted permanently.");
    }
}
