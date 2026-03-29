<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Services\FcmService;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;

/**
 * SendOrderPushNotification
 *
 * Handles FCM native push and Web Push for order status changes.
 * Separated from the event constructor so a push failure never
 * prevents the Pusher broadcast from firing.
 */
class SendOrderPushNotification
{
    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;

        // Web Push — for PWA / browser subscribers
        try {
            app(PushNotificationService::class)->sendToUser($order->user, [
                'title'    => $event->title,
                'body'     => $event->message,
                'url'      => "/orders/{$order->id}",
                'tag'      => "order-{$order->id}",
                'order_id' => $order->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[Push] Web push failed', ['error' => $e->getMessage()]);
        }

        // FCM Native — for Android app
        if ($order->user->fcm_token) {
            try {
                app(FcmService::class)->sendToToken(
                    $order->user->fcm_token,
                    $event->title,
                    $event->message,
                    [
                        'order_id'        => (string) $order->id,
                        'order_number'    => $order->order_number,
                        'type'            => $event->type,
                        'delivery_status' => $order->delivery_status,
                        'url'             => "/orders/{$order->id}",
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning('[FCM] Native push failed', ['error' => $e->getMessage()]);
            }
        }
    }
}
