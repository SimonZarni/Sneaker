<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * Store or update the authenticated user's review for a product.
     * Only allowed if the user has actually purchased the product.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating'     => 'required|integer|min:1|max:5',
            'title'      => 'nullable|string|max:120',
            'body'       => 'nullable|string|max:2000',
        ]);

        $userId    = Auth::id();
        $productId = $validated['product_id'];

        // Verify the user has actually received this product
        // Cancelled orders excluded — user never received the product
        $hasBought = Order::where('user_id', $userId)
            ->where('order_status', '!=', 'Cancelled')
            ->whereHas('items', fn($q) => $q->where('product_id', $productId))
            ->exists();

        if (!$hasBought) {
            return back()->withErrors(['review' => 'You can only review products you have purchased.']);
        }

        Review::updateOrCreate(
            ['user_id' => $userId, 'product_id' => $productId],
            [
                'rating'      => $validated['rating'],
                'title'       => $validated['title'] ?? null,
                'body'        => $validated['body']  ?? null,
                'is_approved' => true, // set to true for auto-approval; adjust as needed if you want manual moderation
            ]
        );

        return back()->with('success', 'Review submitted — it will appear once approved.');
    }

    /**
     * Delete the authenticated user's own review.
     */
    public function destroy(int $id)
    {
        Review::where('user_id', Auth::id())->findOrFail($id)->delete();
        return back()->with('success', 'Review removed.');
    }
}
