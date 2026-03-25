/**
 * Native Google Sign-In for Capacitor Android.
 * Uses @codetrix-studio/capacitor-google-auth which shows a native account
 * picker sheet without ever leaving the app.
 */
export async function googleNativeLogin(): Promise<void> {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;

    const xsrf = decodeURIComponent(
        document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
    );

    const res = await fetch('/auth/google/native', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
        body: JSON.stringify({ id_token: idToken }),
    });

    if (res.ok) {
        window.location.href = '/';
    } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Google sign-in failed');
    }
}
