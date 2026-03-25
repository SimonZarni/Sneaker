<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\Response;

class PushController extends Controller
{
    /**
     * Store a new push subscription for the authenticated user.
     * Called from usePwa.ts → subscribeToPush()
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subscription.endpoint'        => 'required|url|max:2000',
            'subscription.keys.p256dh'     => 'required|string',
            'subscription.keys.auth'       => 'required|string',
        ]);

        $sub = $validated['subscription'];

        // Upsert: if this endpoint already exists (user re-subscribed), update keys
        PushSubscription::updateOrCreate(
            ['endpoint' => $sub['endpoint']],
            [
                'user_id'      => $request->user()->id,
                'public_key'   => $sub['keys']['p256dh'],
                'auth_token'   => $sub['keys']['auth'],
                'user_agent'   => $request->userAgent(),
                'last_used_at' => now(),
            ]
        );

        return response()->json(['status' => 'subscribed']);
    }

    /**
     * Store (or update) the FCM device token for the authenticated user.
     * Called from the Capacitor app on every launch after push permission is granted.
     */
    public function storeFcmToken(Request $request): Response
    {
        $validated = $request->validate([
            'token' => 'required|string|max:500',
        ]);

        $request->user()->update(['fcm_token' => $validated['token']]);

        return response()->noContent();
    }

    /**
     * Remove a push subscription (user toggled off or cleared browser data).
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|url|max:2000',
        ]);

        PushSubscription::where('endpoint', $validated['endpoint'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['status' => 'unsubscribed']);
    }

    /**
     * Serve the offline fallback page for the service worker.
     * Route: GET /offline
     */
    public function offline(): BinaryFileResponse
    {
        return response()->file(public_path('offline.html'), [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
