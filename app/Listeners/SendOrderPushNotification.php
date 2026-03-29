<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Services\FcmService;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;

class SendOrderPushNotification
{
    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $user  = $order->user;

        // Web Push — PWA/browser only.
        // Skip if the user has an FCM token (native app) — FCM handles the
        // notification for them. Sending both causes duplicate system notifications
        // because the Android WebView service worker also receives the web push.
        if (! $user->fcm_token) {
            try {
                app(PushNotificationService::class)->sendToUser($user, [
                    'title'    => $event->title,
                    'body'     => $event->message,
                    'url'      => "/orders/{$order->id}",
                    'tag'      => "order-{$order->id}",
                    'order_id' => $order->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('[Push] Web push failed', ['error' => $e->getMessage()]);
            }
        }

        // FCM Native — Android app.
        if ($user->fcm_token) {
            try {
                app(FcmService::class)->sendToToken(
                    $user->fcm_token,
                    $event->title,
                    $event->message,
                    [
                        'id'              => (string) $order->id . '-' . $event->type,
                        'order_id'        => (string) $order->id,
                        'order_number'    => $order->order_number,
                        'type'            => $event->type,
                        'delivery_status' => $order->delivery_status,
                        'icon'            => $event->icon ?? '📦',
                        'url'             => "/orders/{$order->id}",
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning('[FCM] Native push failed', ['error' => $e->getMessage()]);
            }
        } else {
            Log::info('[FCM] Skipped — no FCM token for user', ['user_id' => $user->id]);
        }
    }
}
