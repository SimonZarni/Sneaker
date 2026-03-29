import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import type { Notification } from '@/Contexts/NotificationContext';

// ── Bug 5 fix: buffer native push events that arrive before NotificationContext mounts ──
// The Capacitor push listener fires before React renders. If a notification arrives
// during the ~200ms splash/first-paint window it would be dispatched before
// NotificationContext's useEffect has attached its listener — and be silently lost.
// We hold events here; NotificationContext drains & clears this queue on mount,
// after which all subsequent events are dispatched live directly to window.
(window as any).__pendingCapacitorNotifications = [] as CustomEvent[];

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Extract userId from shared Inertia props so NotificationProvider
        // can subscribe to the correct Pusher channel.
        // Cast to any because PageProps typing doesn't include our custom auth shape.
        const userId = (props.initialPage.props as any)?.auth?.user?.id ?? null;

        root.render(
            <NotificationProvider userId={userId}>
                <App {...props} />
            </NotificationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// ── Capacitor native platform initialisation ──────────────────────────────────
import('@capacitor/core').then(({ Capacitor }) => {
    if (!Capacitor.isNativePlatform()) return;

    // Hide splash once the WebView has painted the first frame.
    // We use a short timeout after DOMContentLoaded as the most reliable
    // trigger — router.on('finish') can miss the very first navigation.
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        const hide = () => SplashScreen.hide({ fadeOutDuration: 100 });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(hide, 150));
        } else {
            setTimeout(hide, 150);
        }
    });

    // Hide splash screen once the webview has fully loaded and rendered.
    // We wait for the Inertia page to finish navigating before hiding so
    // there's no flash of unstyled content — the branded splash stays up
    // until the actual page is painted and ready.
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        import('@inertiajs/core').then(({ router }) => {
            router.on('finish', () => {
                SplashScreen.hide({ fadeOutDuration: 300 });
            });
        });
    });

    // Step 5 — Status bar branding
    Promise.all([
        import('@capacitor/status-bar'),
    ]).then(([{ StatusBar, Style }]) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0A0A0A' });
    });

    // Step 6 — Android back button
    import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });
    });

    // Step 5b — Google Auth initialisation (must run before any GoogleAuth.signIn() call)
    import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        GoogleAuth.initialize({
            clientId: '941450594198-g9jagh4gnesi6sk4ghis5frcumfeg4dv.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: false,
        });

        // Sign out of Google when the user logs out so the next signIn() shows the account picker
        import('@inertiajs/core').then(({ router }) => {
            router.on('before', (event) => {
                const url = (event.detail.visit as any)?.url;
                if (url && String(url).includes('/logout')) {
                    GoogleAuth.signOut().catch(() => {});
                }
            });
        });
    });

    // Step 6b — Google OAuth deep link handler
    // After Google OAuth, the server redirects to com.sneaker.drp://auth/callback?token=TOKEN
    // We receive it here, close any open browser, then navigate the WebView to /auth/app-verify
    import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('appUrlOpen', ({ url }) => {
            if (url.startsWith('com.sneaker.drp://auth/callback')) {
                const token = new URL(url).searchParams.get('token');
                if (token) {
                    // Close the Chrome Custom Tab if still open
                    import('@capacitor/browser').then(({ Browser }) => Browser.close()).catch(() => {});
                    // Navigate the WebView to the verify endpoint — Laravel will log in and redirect to /
                    window.location.href = `/auth/app-verify?token=${encodeURIComponent(token)}`;
                }
            }
        });
    });

    // Step 7 — Native push notifications
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.requestPermissions().then(({ receive }) => {
            if (receive !== 'granted') return;
            PushNotifications.register();
        });

        // Bug 3 fix: use axios instead of raw fetch.
        // In Capacitor remote-server mode the XSRF-TOKEN cookie may not be set yet when
        // the registration event fires (cold launch). Manually extracting the cookie and
        // setting X-XSRF-TOKEN with fetch races against the cookie being written.
        // Axios reads the cookie lazily at request time and handles encoding correctly —
        // so the token POST always succeeds as long as the user has a session.
        const postFcmToken = (token: string) =>
            axios.post('/push/fcm-token', { token });

        // Save the FCM device token to the server so Laravel can send native pushes.
        // Also cache it in localStorage so it can be retried after login if the user
        // wasn't authenticated when the registration event first fired (axios rejects on 401/419).
        PushNotifications.addListener('registration', ({ value: token }) => {
            try { localStorage.setItem('_fcm_pending_token', token); } catch {}
            postFcmToken(token)
                .then(() => { try { localStorage.removeItem('_fcm_pending_token'); } catch {} })
                .catch(() => {}); // will retry on next navigate (see below)
        });

        // Retry sending a cached FCM token on every page navigation (kicks in after login
        // or once the XSRF cookie is available after a fresh session is established).
        import('@inertiajs/core').then(({ router }) => {
            router.on('navigate', () => {
                const pending = localStorage.getItem('_fcm_pending_token');
                if (!pending) return;
                postFcmToken(pending)
                    .then(() => { try { localStorage.removeItem('_fcm_pending_token'); } catch {} })
                    .catch(() => {});
            });
        });

        // Foreground push — feed into NotificationContext via custom event.
        // Bug 5 fix: if NotificationContext hasn't mounted yet (splash screen still showing),
        // queue the event rather than dispatching it live. NotificationContext drains the queue
        // on its first useEffect run, then sets __pendingCapacitorNotifications to null to
        // signal that all subsequent events should be dispatched directly.
        PushNotifications.addListener('pushNotificationReceived', (push) => {
            const data = push.data ?? {};
            const notification: Notification = {
                id:              data.id ?? String(Date.now()),
                order_id:        Number(data.order_id ?? 0),
                order_number:    data.order_number ?? '',
                type:            data.type ?? 'push',
                title:           push.title ?? data.title ?? '',
                message:         push.body  ?? data.message ?? '',
                icon:            data.icon  ?? '📦',
                delivery_status: data.delivery_status ?? '',
                received_at:     new Date().toISOString(),
                read:            false,
            };
            const evt = new CustomEvent<Notification>('capacitor-notification', { detail: notification });
            const queue = (window as any).__pendingCapacitorNotifications;
            if (Array.isArray(queue)) {
                // NotificationContext hasn't mounted yet — buffer for later
                queue.push(evt);
            } else {
                // Context is live — dispatch directly
                window.dispatchEvent(evt);
            }
        });

        // Tap on background/killed push — navigate to URL in payload
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const url = action.notification.data?.url;
            if (url) {
                window.location.href = url;
            }
        });
    });
});
