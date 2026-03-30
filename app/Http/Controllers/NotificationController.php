<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest('occurred_at')
            ->limit(20)
            ->get()
            ->map(fn (UserNotification $notification) => $notification->toFrontend())
            ->values();

        return response()->json($items);
    }

    public function markRead(Request $request, string $notifKey): JsonResponse
    {
        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('notif_key', $notifKey)
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
