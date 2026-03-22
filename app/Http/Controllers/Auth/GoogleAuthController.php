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
                // Account exists — link Google ID via explicit assignment
                // (not update() since google_id is not in $fillable)
                $user->google_id = $googleUser->getId();
                $user->save();
            } else {
                // 3. Brand new user — create account from Google profile
                $user = new User();
                $user->name              = $googleUser->getName();
                $user->email             = $googleUser->getEmail();
                $user->google_id         = $googleUser->getId();
                $user->email_verified_at = now();
                $user->password          = null;
                $user->is_active         = true;
                $user->save();
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
