<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth page.
     * Stores 'capacitor' source in session so callback can detect native app flow.
     */
    public function redirect(Request $request)
    {
        $isCapacitor = $request->query('source') === 'capacitor';

        // Chrome Custom Tabs share cookies with the Chrome browser, so an existing
        // Chrome session arrives here even when the user is logging in via the native app.
        if (Auth::check()) {
            if ($isCapacitor) {
                // Already authenticated — skip OAuth and issue a deep-link token directly.
                $token = Str::random(64);
                Cache::put("oauth_app_token:{$token}", Auth::id(), now()->addMinutes(5));
                return redirect("com.sneaker.drp://auth/callback?token={$token}");
            }
            // Authenticated web user — behave like guest middleware normally would.
            return redirect('/');
        }

        if ($isCapacitor) {
            session(['oauth_source' => 'capacitor']);
        }

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

        // Native app flow: redirect back via deep link with a one-time token
        if (session()->pull('oauth_source') === 'capacitor') {
            $token = Str::random(64);
            Cache::put("oauth_app_token:{$token}", $user->id, now()->addMinutes(5));
            return redirect("com.sneaker.drp://auth/callback?token={$token}");
        }

        return redirect()->intended('/');
    }

    /**
     * Verify a Google ID token sent directly from the native app (no browser flow).
     * Used by @codetrix-studio/capacitor-google-auth on Android.
     */
    public function nativeCallback(Request $request)
    {
        $idToken = $request->input('id_token', '');

        if (!$idToken) {
            return response()->json(['error' => 'Missing token'], 422);
        }

        // Verify the ID token with Google's tokeninfo endpoint
        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);

        if (!$response->ok()) {
            return response()->json(['error' => 'Invalid Google token'], 401);
        }

        $googleData = $response->json();

        // Ensure the token was issued for our app
        $clientId = config('services.google.client_id');
        if (($googleData['aud'] ?? '') !== $clientId) {
            return response()->json(['error' => 'Token audience mismatch'], 401);
        }

        $googleId = $googleData['sub'];
        $email    = $googleData['email'] ?? null;
        $name     = $googleData['name']  ?? $email;

        if (!$email) {
            return response()->json(['error' => 'Google account has no email'], 422);
        }

        // Reuse the same find-or-create logic as the web callback
        $user = User::where('google_id', $googleId)->first();

        if (!$user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->google_id = $googleId;
                $user->save();
            } else {
                $user = new User();
                $user->name              = $name;
                $user->email             = $email;
                $user->google_id         = $googleId;
                $user->email_verified_at = now();
                $user->password          = null;
                $user->is_active         = true;
                $user->save();
            }
        }

        if (!$user->is_active) {
            return response()->json(['error' => 'Your account has been suspended. Please contact support.'], 403);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json(['success' => true]);
    }

    /**
     * Verify a one-time OAuth token from the native app deep link and log the user in.
     * The WebView navigates here after receiving the deep link.
     */
    public function appVerify(Request $request)
    {
        $token  = $request->query('token', '');
        $userId = Cache::pull("oauth_app_token:{$token}");

        if (!$userId) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Login link expired or invalid. Please try again.']);
        }

        $user = User::find($userId);

        if (!$user || !$user->is_active) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Account not found or suspended.']);
        }

        Auth::login($user, remember: true);
        request()->session()->regenerate();

        return redirect('/');
    }
}
