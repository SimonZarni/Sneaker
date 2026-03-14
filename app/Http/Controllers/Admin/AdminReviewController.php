<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::with(['user:id,name', 'product:id,name'])
            ->latest()
            ->get()
            ->map(fn($r) => $this->fmt($r));

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'admin'   => ['name' => Auth::guard('admin')->user()->full_name],
            'stats'   => ['total' => $reviews->count()],
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
            'user_name'    => $r->user->name,
            'product_id'   => $r->product_id,
            'product_name' => $r->product->name,
            'created_at'   => $r->created_at->toISOString(),
        ];
    }
}
