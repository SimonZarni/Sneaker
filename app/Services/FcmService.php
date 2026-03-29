<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

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

            // Data-only FCM message — NO notification payload.
            //
            // Why: when ->withNotification() is used, Android auto-displays the
            // notification via the FCM SDK (system tray) REGARDLESS of app state.
            // Capacitor's pushNotificationReceived listener ALSO fires and shows the
            // in-app toast, causing every notification to appear twice.
            //
            // With a data-only message the OS never auto-displays anything.
            // Capacitor receives the push, fires pushNotificationReceived, and our
            // NotificationContext handles display exclusively — one notification, always.
            //
            // title and body are folded into the data map so the JS side can read them
            // from push.data (push.title / push.body would be empty for data-only pushes).
            $stringData = array_map('strval', array_merge([
                'title' => $title,
                'body'  => $body,
            ], $data));

            $message = CloudMessage::withTarget('token', $fcmToken)
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
