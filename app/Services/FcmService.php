<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FcmService
{
    /**
     * Send a native FCM push notification to a single device token.
     *
     * @param  string  $fcmToken  The device registration token from Capacitor
     * @param  string  $title
     * @param  string  $body
     * @param  array   $data      Extra key→value pairs (all values must be strings)
     */
    public function sendToToken(string $fcmToken, string $title, string $body, array $data = []): void
    {
        $credentialsPath = storage_path('app/firebase-credentials.json');

        if (! file_exists($credentialsPath)) {
            Log::warning('[FCM] firebase-credentials.json not found — skipping native push');
            return;
        }

        try {
            $messaging = (new Factory)
                ->withServiceAccount($credentialsPath)
                ->createMessaging();

            // FCM data payload values must all be strings
            $stringData = array_map('strval', $data);

            $message = CloudMessage::withTarget('token', $fcmToken)
                ->withNotification(Notification::create($title, $body))
                ->withData($stringData);

            $messaging->send($message);

            Log::info('[FCM] Native push sent', ['token_tail' => substr($fcmToken, -8)]);
        } catch (\Throwable $e) {
            Log::warning('[FCM] Failed to send native push', [
                'error'      => $e->getMessage(),
                'token_tail' => substr($fcmToken, -8),
            ]);
        }
    }
}
