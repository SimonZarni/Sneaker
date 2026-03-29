<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One-time cleanup: remove web push subscriptions for users who have an FCM
 * token (i.e. the native Android app).
 *
 * Background: the Capacitor WebView registers the service worker and could
 * create a web push subscription alongside the FCM token.  The listener
 * SendOrderPushNotification sends to BOTH, causing two identical system
 * notifications on the device.  This migration removes the stale web push
 * subscriptions so native users only receive FCM pushes going forward.
 *
 * The application-level fix (usePwa.ts + PushNotificationToggle) prevents
 * new subscriptions from being created on native, so this migration only
 * needs to run once to clean up any pre-fix rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        $deleted = DB::table('push_subscriptions')
            ->whereIn('user_id', function ($query) {
                $query->select('id')
                      ->from('users')
                      ->whereNotNull('fcm_token')
                      ->where('fcm_token', '!=', '');
            })
            ->delete();

        \Illuminate\Support\Facades\Log::info(
            "[Migration] Removed {$deleted} web push subscription(s) for native app users."
        );
    }

    public function down(): void
    {
        // Intentionally empty — deleted subscriptions cannot be restored.
        // Native users will re-subscribe via web push if they visit on a browser.
    }
};
