import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import type { Notification } from '@/Contexts/NotificationContext';

// Buffer native push events that arrive before NotificationContext mounts.
// The Capacitor push listener fires before React renders. If a notification
// arrives during the splash/first-paint window it would be lost.
// NotificationContext drains & clears this queue on mount.
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

    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        const hide = () => SplashScreen.hide({ fadeOutDuration: 100 });
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(hide, 150));
        } else {
            setTimeout(hide, 150);
        }
    });

    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        import('@inertiajs/core').then(({ router }) => {
            router.on('finish', () => {
                SplashScreen.hide({ fadeOutDuration: 300 });
            });
        });
    });

    Promise.all([
        import('@capacitor/status-bar'),
    ]).then(([{ StatusBar, Style }]) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0A0A0A' });
    });

    import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });
    });

    import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        GoogleAuth.initialize({
            clientId: '941450594198-g9jagh4gnesi6sk4ghis5frcumfeg4dv.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: false,
        });

        import('@inertiajs/core').then(({ router }) => {
            router.on('before', (event) => {
                const url = (event.detail.visit as any)?.url;
                if (url && String(url).includes('/logout')) {
                    GoogleAuth.signOut().catch(() => {});
                }
            });
        });
    });

    import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('appUrlOpen', ({ url }) => {
            if (url.startsWith('com.sneaker.drp://auth/callback')) {
                const token = new URL(url).searchParams.get('token');
                if (token) {
                    import('@capacitor/browser').then(({ Browser }) => Browser.close()).catch(() => {});
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

        // Use axios — reads XSRF-TOKEN cookie lazily at request time,
        // avoiding the race condition on cold launch with raw fetch.
        // Returns true on success so callers can clear the pending token.
        const postFcmToken = (token: string): Promise<boolean> =>
            axios.post('/push/fcm-token', { token })
                .then(() => true)
                .catch(() => false);

        // Shared helper: flush the pending token if one is stored.
        // Guards against concurrent in-flight requests with a simple flag.
        let _fcmSending = false;
        const flushPendingToken = () => {
            if (_fcmSending) return;
            const pending = localStorage.getItem('_fcm_pending_token');
            if (!pending) return;
            _fcmSending = true;
            postFcmToken(pending).then((ok) => {
                _fcmSending = false;
                if (ok) { try { localStorage.removeItem('_fcm_pending_token'); } catch {} }
            });
        };

        PushNotifications.addListener('registration', ({ value: token }) => {
            // Always persist first — if the POST succeeds immediately, great.
            // If not (session not yet established), the retry listeners pick it up.
            try { localStorage.setItem('_fcm_pending_token', token); } catch {}
            flushPendingToken();
        });

        // Retry on page finish (fires after the very first Inertia page fully
        // loads — critical for cold-launch where registration fires during splash)
        // AND on every navigation (covers the post-login redirect case).
        import('@inertiajs/core').then(({ router }) => {
            router.on('finish',   flushPendingToken);
            router.on('navigate', flushPendingToken);
        });

        // Foreground push — feed into NotificationContext via custom event
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
                queue.push(evt);
            } else {
                window.dispatchEvent(evt);
            }
        });

        // Tap on background/killed push — navigate to order
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const url = action.notification.data?.url;
            if (url) {
                window.location.href = url;
            }
        });
    });
});
