<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    /**
     * Send a push notification to all subscribed devices for a user.
     *
     * @param  User   $user
     * @param  array  $payload  Keys: title, body, icon, url, tag, image, order_id
     */
    public function sendToUser(User $user, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $this->dispatchBatch($subscriptions->all(), $payload);
    }

    /**
     * Send to a specific subscription endpoint (e.g. test from admin).
     */
    public function sendToEndpoint(string $endpoint, array $payload): void
    {
        $sub = PushSubscription::where('endpoint', $endpoint)->first();
        if ($sub) {
            $this->dispatchBatch([$sub], $payload);
        }
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private function dispatchBatch(array $subscriptions, array $payload): void
    {
        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject'    => config('services.vapid.subject'),
                    'publicKey'  => config('services.vapid.public_key'),
                    'privateKey' => config('services.vapid.private_key'),
                ],
            ]);

            $jsonPayload = json_encode([
                'title'    => $payload['title']    ?? 'SNEAKER.DRP',
                'body'     => $payload['body']     ?? $payload['message'] ?? '',
                'icon'     => $payload['icon']     ?? '/icons/icon-192.png',
                'url'      => $payload['url']      ?? '/',
                'tag'      => $payload['tag']      ?? 'sneaker-order',
                'order_id' => $payload['order_id'] ?? null,
                'image'    => $payload['image']    ?? null,
            ]);

            foreach ($subscriptions as $sub) {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys'     => [
                        'p256dh' => $sub->public_key,
                        'auth'   => $sub->auth_token,
                    ],
                ]);

                $webPush->queueNotification($subscription, $jsonPayload);
            }

            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();

                if ($report->isSubscriptionExpired()) {
                    // Clean up stale subscriptions automatically
                    PushSubscription::where('endpoint', $endpoint)->delete();
                } elseif (! $report->isSuccess()) {
                    Log::warning('[Push] Failed to send notification', [
                        'endpoint' => $endpoint,
                        'reason'   => $report->getReason(),
                    ]);
                } else {
                    PushSubscription::where('endpoint', $endpoint)
                        ->update(['last_used_at' => now()]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('[Push] Exception sending notification: ' . $e->getMessage());
        }
    }
}
