<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth page.
     */
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google after authentication.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Google authentication failed. Please try again.']);
        }

        // 1. Find existing user by google_id (returning Google user)
        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            // 2. Find existing user by email (has an account but never used Google)
            //    Link their Google account to the existing email account.
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Account exists — link Google ID to it
                $user->update(['google_id' => $googleUser->getId()]);
            } else {
                // 3. Brand new user — create account from Google profile
                $user = User::create([
                    'name'              => $googleUser->getName(),
                    'email'             => $googleUser->getEmail(),
                    'google_id'         => $googleUser->getId(),
                    'email_verified_at' => now(), // Google emails are already verified
                    'password'          => null,  // No password for Google-only accounts
                    'is_active'         => true,
                ]);
            }
        }

        // Block deactivated accounts — same guard as email login
        if (!$user->is_active) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Your account has been suspended. Please contact support.']);
        }

        Auth::login($user, remember: true);

        request()->session()->regenerate();

        return redirect()->intended('/');
    }
}
