<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Color;
use App\Models\Gender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminSettingsController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index()
    {
        return Inertia::render('Admin/Settings', [
            'brands'     => Brand::orderBy('name')->get(['id', 'name', 'logo_url']),
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'genders'    => Gender::orderBy('name')->get(['id', 'name']),
            'colors'     => Color::orderBy('name')->get(['id', 'name', 'hex_code']),
            'admin'      => ['name' => Auth::guard('admin')->user()->full_name],
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

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(string $type, int $id)
    {
        match ($type) {
            'brand'    => Brand::findOrFail($id)->delete(),
            'category' => Category::findOrFail($id)->delete(),
            'gender'   => Gender::findOrFail($id)->delete(),
            'color'    => Color::findOrFail($id)->delete(),
            default    => abort(404),
        };

        return back()->with('success', ucfirst($type) . ' deleted.');
    }
}
