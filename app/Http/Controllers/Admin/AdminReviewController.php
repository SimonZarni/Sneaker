<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminReviewController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $query = Review::with(['user:id,name', 'product:id,name'])->latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn($q) => $q->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user',    fn($q) => $q->where('name', 'like', "%{$search}%"))
                  ->orWhere('title',               'like', "%{$search}%");
            });
        }

        // Separate count query for stats — never use $collection->count()
        // after a paginate() call since it only counts the current page.
        $total = Review::count();

        $reviews = $query->paginate(25)->through(fn($r) => $this->fmt($r));

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'admin'   => ['name' => Auth::guard('admin')->user()->full_name],
            'stats'   => ['total' => $total],
            'filters' => ['search' => $search],
        ]);
    }

    public function destroy(int $id)
    {
        Review::findOrFail($id)->delete();
        return back()->with('success', 'Review deleted.');
    }

    private function fmt(Review $r): array
    {
        return [
            'id'           => $r->id,
            'rating'       => $r->rating,
            'title'        => $r->title,
            'body'         => $r->body,
            'user_name'    => $r->user?->name    ?? 'Deleted User',
            'product_id'   => $r->product_id,
            'product_name' => $r->product?->name ?? 'Deleted Product',
            'created_at'   => $r->created_at->toISOString(),
        ];
    }
}
