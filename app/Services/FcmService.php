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

        // On Railway (and any ephemeral host), the JSON file cannot be committed to git.
        // Set FIREBASE_CREDENTIALS_JSON in Railway Variables to the full JSON content.
        // The file is written once per request and is safe — storage/ is writable.
        $credentialsJson = env('FIREBASE_CREDENTIALS_JSON');
        if ($credentialsJson && ! file_exists($credentialsPath)) {
            @file_put_contents($credentialsPath, $credentialsJson);
        }

        if (! file_exists($credentialsPath)) {
            Log::warning('[FCM] No Firebase credentials available (set FIREBASE_CREDENTIALS_JSON env var on Railway)');
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
