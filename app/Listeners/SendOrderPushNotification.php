<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\UserNotification;
use App\Services\FcmService;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;

class SendOrderPushNotification
{
    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $user  = $order->user;

        if (! $user) {
            return;
        }

        // Canonical ID for this specific event — shared by DB history, web push,
        // FCM, and the frontend bell. Format: "{order_id}-{event_type}".
        $uniqueId = $order->id . '-' . $event->type;

        UserNotification::updateOrCreate(
            ['notif_key' => $uniqueId],
            [
                'user_id' => $user->id,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'type' => $event->type,
                'title' => $event->title,
                'message' => $event->message,
                'icon' => $event->icon ?? '📦',
                'delivery_status' => $order->delivery_status,
                'occurred_at' => now(),
                'read_at' => null,
            ]
        );

        // Web Push — PWA/browser only.
        // Skip if the user has an FCM token (native app) — FCM handles the
        // system notification for them. Sending both causes duplicate system
        // notifications because the Android WebView service worker also receives
        // the web push.
        if (! $user->fcm_token) {
            try {
                app(PushNotificationService::class)->sendToUser($user, [
                    'id' => $uniqueId,
                    'title' => $event->title,
                    'body' => $event->message,
                    'url' => "/orders/{$order->id}",
                    'tag' => $uniqueId,
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
                        'id' => $uniqueId,
                        'order_id' => (string) $order->id,
                        'order_number' => $order->order_number,
                        'type' => $event->type,
                        'delivery_status' => $order->delivery_status,
                        'icon' => $event->icon ?? '📦',
                        'url' => "/orders/{$order->id}",
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
