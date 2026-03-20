<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Setting;
use App\Models\Category;
use App\Models\Color;
use App\Models\Gender;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class AdminSettingsController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index()
    {
        return Inertia::render('Admin/Settings', [
            'brands'      => Brand::orderBy('name')->get(['id', 'name', 'logo_url']),
            'categories'  => Category::orderBy('name')->get(['id', 'name']),
            'genders'     => Gender::orderBy('name')->get(['id', 'name']),
            'colors'      => Color::orderBy('name')->get(['id', 'name', 'hex_code']),
            'shippingFee' => (float) Setting::get('shipping_fee', '0.00'),
            'admin'       => ['name' => Auth::guard('admin')->user()->full_name],
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request, string $type)
    {
        match ($type) {
            'brand' => $this->storeBrand($request),
            'category' => $this->storeCategory($request),
            'gender' => $this->storeGender($request),
            'color' => $this->storeColor($request),
            default => abort(404),
        };

        Cache::forget('navigation');
        return back()->with('success', ucfirst($type) . ' created successfully.');
    }

    private function storeBrand(Request $request): void
    {
        $request->validate([
            'name'     => 'required|string|max:100|unique:brands,name',
            'logo_url' => 'nullable|url|max:2048',
        ]);
        Brand::create(['name' => $request->name, 'logo_url' => $request->logo_url]);
    }

    private function storeCategory(Request $request): void
    {
        $request->validate(['name' => 'required|string|max:100|unique:categories,name']);
        Category::create(['name' => $request->name]);
    }

    private function storeGender(Request $request): void
    {
        $request->validate(['name' => 'required|string|max:100|unique:genders,name']);
        Gender::create(['name' => $request->name]);
    }

    private function storeColor(Request $request): void
    {
        $request->validate([
            'name'     => 'required|string|max:100|unique:colors,name',
            'hex_code' => 'nullable|string|max:10',
        ]);
        Color::create(['name' => $request->name, 'hex_code' => $request->hex_code]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, string $type, int $id)
    {
        match ($type) {
            'brand'    => $this->updateBrand($request, $id),
            'category' => $this->updateCategory($request, $id),
            'gender'   => $this->updateGender($request, $id),
            'color'    => $this->updateColor($request, $id),
            default    => abort(404),
        };

        Cache::forget('navigation');
        return back()->with('success', ucfirst($type) . ' updated successfully.');
    }

    private function updateBrand(Request $request, int $id): void
    {
        $request->validate([
            'name'     => "required|string|max:100|unique:brands,name,{$id}",
            'logo_url' => 'nullable|url|max:2048',
        ]);
        Brand::findOrFail($id)->update(['name' => $request->name, 'logo_url' => $request->logo_url]);
    }

    private function updateCategory(Request $request, int $id): void
    {
        $request->validate(['name' => "required|string|max:100|unique:categories,name,{$id}"]);
        Category::findOrFail($id)->update(['name' => $request->name]);
    }

    private function updateGender(Request $request, int $id): void
    {
        $request->validate(['name' => "required|string|max:100|unique:genders,name,{$id}"]);
        Gender::findOrFail($id)->update(['name' => $request->name]);
    }

    private function updateColor(Request $request, int $id): void
    {
        $request->validate([
            'name'     => "required|string|max:100|unique:colors,name,{$id}",
            'hex_code' => 'nullable|string|max:10',
        ]);
        Color::findOrFail($id)->update(['name' => $request->name, 'hex_code' => $request->hex_code]);
    }

    // ── Shipping Fee ──────────────────────────────────────────────────────────

    public function updateShippingFee(Request $request)
    {
        $request->validate([
            'shipping_fee' => 'required|numeric|min:0|max:9999',
        ]);

        Setting::set('shipping_fee', number_format((float) $request->shipping_fee, 2, '.', ''));

        return back()->with('success', 'Shipping fee updated successfully.');
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(string $type, int $id)
    {
        $error = match ($type) {
            'brand'    => $this->destroyBrand($id),
            'category' => $this->destroyCategory($id),
            'gender'   => $this->destroyGender($id),
            'color'    => $this->destroyColor($id),
            default    => abort(404),
        };

        Cache::forget('navigation');

        if ($error) {
            return back()->withErrors(['delete' => $error]);
        }

        return back()->with('success', ucfirst($type) . ' deleted.');
    }

    private function destroyBrand(int $id): ?string
    {
        $brand = Brand::findOrFail($id);
        $count = Product::where('brand_id', $id)->count();

        if ($count > 0) {
            return "Cannot delete \"{$brand->name}\" — {$count} " . ($count === 1 ? 'product is' : 'products are') . ' assigned to it. Reassign or delete those products first.';
        }

        $brand->delete();
        return null;
    }

    private function destroyCategory(int $id): ?string
    {
        $category = Category::findOrFail($id);
        $count    = Product::where('category_id', $id)->count();

        if ($count > 0) {
            return "Cannot delete \"{$category->name}\" — {$count} " . ($count === 1 ? 'product is' : 'products are') . ' assigned to it. Reassign or delete those products first.';
        }

        $category->delete();
        return null;
    }

    private function destroyGender(int $id): ?string
    {
        $gender = Gender::findOrFail($id);
        $count  = Product::where('gender_id', $id)->count();

        if ($count > 0) {
            return "Cannot delete \"{$gender->name}\" — {$count} " . ($count === 1 ? 'product is' : 'products are') . ' assigned to it. Reassign or delete those products first.';
        }

        $gender->delete();
        return null;
    }

    private function destroyColor(int $id): ?string
    {
        $color = Color::findOrFail($id);
        $count = ProductVariant::where('color_id', $id)->count();

        if ($count > 0) {
            return "Cannot delete \"{$color->name}\" — {$count} product " . ($count === 1 ? 'variant uses' : 'variants use') . ' this color. Remove those variants first.';
        }

        $color->delete();
        return null;
    }
}
