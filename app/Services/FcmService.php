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
        // The file is written once and is safe — storage/ is writable.
        $credentialsJson = env('FIREBASE_CREDENTIALS_JSON');

        if ($credentialsJson && ! file_exists($credentialsPath)) {
            // Validate the JSON is well-formed before writing —
            // a malformed env value would cause a cryptic Kreait error later.
            $decoded = json_decode($credentialsJson, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('[FCM] FIREBASE_CREDENTIALS_JSON is not valid JSON — cannot write credentials file', [
                    'json_error' => json_last_error_msg(),
                ]);
                return;
            }

            // Sanity-check it looks like a service account (not google-services.json).
            // A common mistake is pasting google-services.json instead of the
            // service account key from Firebase Console → Project Settings →
            // Service Accounts → Generate New Private Key.
            if (empty($decoded['private_key']) || empty($decoded['client_email'])) {
                Log::error('[FCM] FIREBASE_CREDENTIALS_JSON is missing private_key or client_email. ' .
                    'Use the SERVICE ACCOUNT key (Firebase Console → Project Settings → ' .
                    'Service Accounts → Generate New Private Key), NOT google-services.json.');
                return;
            }

            @file_put_contents($credentialsPath, $credentialsJson);
        }

        // Diagnostic log — safe to remove once confirmed working in production.
        Log::debug('[FCM] Credentials check', [
            'env_var_set' => ! empty($credentialsJson),
            'file_exists' => file_exists($credentialsPath),
            'path'        => $credentialsPath,
        ]);

        if (! file_exists($credentialsPath)) {
            Log::warning('[FCM] firebase-credentials.json not found — skipping native push. ' .
                'Set FIREBASE_CREDENTIALS_JSON in your Railway environment variables.');
            return;
        }

        try {
            $messaging = (new Factory)
                ->withServiceAccount($credentialsPath)
                ->createMessaging();

            // FCM data payload values must all be strings.
            // title and body are merged into the data map IN ADDITION to the
            // notification payload. withNotification() drives the Android system
            // tray display (background / killed app). The data map is what
            // Capacitor's pushNotificationReceived exposes as push.data — and
            // that listener is the only way in-app notifications are populated.
            // Without title/body in data, push.data.title is undefined and the
            // in-app NotificationContext receives empty notifications.
            $stringData = array_map('strval', array_merge([
                'title' => $title,
                'body'  => $body,
            ], $data));

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
