<?php

use Illuminate\Support\Facades\Broadcast;

/*
 * Private channel for order notifications.
 * Only the user who owns the orders can subscribe to their channel.
 * The channel name matches what's used in OrderStatusChanged event.
 */
Broadcast::channel('orders.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
