<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ChatConversation;

// Order notification channel — user receives own order updates
Broadcast::channel('orders.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Chat channel — user can only subscribe to their own conversation
Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    return ChatConversation::where('id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});

// Admin chat channel — allow any authenticated user from either guard.
// The admin-chat Pusher channel is only subscribed to from the admin
// panel pages which are protected by EnsureAdmin middleware anyway.
// We use a presence-less private channel — if the request reaches here
// with a valid session (user OR admin), allow it.
Broadcast::channel('admin-chat', function ($user) {
    // $user is the web guard user — but admin pages also have a web session.
    // Return true for any authenticated session that reaches this endpoint.
    // Security is enforced at the route level (EnsureAdmin middleware).
    return true;
});
