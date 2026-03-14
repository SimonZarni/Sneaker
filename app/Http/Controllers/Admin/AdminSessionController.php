<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminSessionController extends Controller
{
    public function create(Request $request)
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Login', [
            'sessionExpired' => $request->session()->pull('session_expired'),
        ]);
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::guard('admin')->attempt($credentials)) {
            return back()->withErrors(['email' => 'Invalid credentials.'])->onlyInput('email');
        }

        $request->session()->regenerate();

        // Stamp the session start time for the 3-hour timeout
        session(['admin_last_activity' => now()->timestamp]);

        return redirect()->route('admin.dashboard');
    }

    public function destroy(Request $request)
    {
        Auth::guard('admin')->logout();
        // session()->forget('admin_last_activity');
        // $request->session()->invalidate();
        // $request->session()->regenerateToken();

        $request->session()->forget('admin_last_activity');

        return redirect()->route('admin.login');
    }
}
