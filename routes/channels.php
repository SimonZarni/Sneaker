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

// Admin chat channel — only authenticated admins
Broadcast::channel('admin-chat', function ($user) {
    // Check if user is an admin guard
    return \Illuminate\Support\Facades\Auth::guard('admin')->check();
});
