<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && ! Auth::user()->is_active) {
            Auth::logout();

            // Use forget instead of invalidate to avoid wiping the admin session
            $request->session()->forget(['_token_web']);
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['email' => 'Your account has been suspended. Please contact support.']);
        }

        return $next($request);
    }
}
