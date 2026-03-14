<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureAdmin
{
    private const SESSION_TIMEOUT = 10800; // 3 hours in seconds

    public function handle(Request $request, Closure $next)
    {
        if (!Auth::guard('admin')->check()) {
            return redirect()->route('admin.login');
        }

        $lastActivity = session('admin_last_activity');

        if (!$lastActivity) {
            session(['admin_last_activity' => now()->timestamp]);
            return $next($request);
        }

        if (now()->timestamp - $lastActivity > self::SESSION_TIMEOUT) {
            Auth::guard('admin')->logout();
            session()->forget('admin_last_activity');

            return redirect()
                ->route('admin.login')
                ->with('admin_session_expired', 'Your session has expired. Please log in again.');
        }

        session(['admin_last_activity' => now()->timestamp]);

        return $next($request);
    }
}
