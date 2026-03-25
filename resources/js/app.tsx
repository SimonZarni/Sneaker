import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import type { Notification } from '@/Contexts/NotificationContext';

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

        // Save the FCM device token to the server so Laravel can send native pushes
        PushNotifications.addListener('registration', ({ value: token }) => {
            const xsrf = decodeURIComponent(
                document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
            );
            fetch('/push/fcm-token', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
                body: JSON.stringify({ token }),
            }).catch(() => { /* silent — token will be sent on next launch */ });
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
            window.dispatchEvent(new CustomEvent<Notification>('capacitor-notification', { detail: notification }));
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
