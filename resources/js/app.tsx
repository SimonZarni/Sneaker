import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import type { Notification } from '@/Contexts/NotificationContext';

(window as any).__pendingCapacitorNotifications = [] as CustomEvent<Notification>[];
(window as any).__authUserId = null as number | null;

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const syncAuthUser = (pageProps: any) => {
    const userId = pageProps?.auth?.user?.id ?? null;
    (window as any).__authUserId = userId;
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { userId } }));
};

const buildNotification = (payload: any): Notification => {
    const data = payload?.data ?? {};

    return {
        id: data.id ?? (data.order_id && data.type ? `${data.order_id}-${data.type}` : `unknown-${data.order_id ?? 'push'}`),
        order_id: Number(data.order_id ?? 0),
        order_number: data.order_number ?? '',
        type: data.type ?? 'push',
        title: data.title ?? payload?.title ?? '',
        message: data.body ?? payload?.body ?? data.message ?? '',
        icon: data.icon ?? '📦',
        delivery_status: data.delivery_status ?? '',
        received_at: new Date().toISOString(),
        read: false,
    };
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        syncAuthUser((props.initialPage.props as any) ?? {});

        root.render(
            <NotificationProvider>
                <App {...props} />
            </NotificationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

import('@inertiajs/core').then(({ router }) => {
    router.on('navigate', (event: any) => {
        syncAuthUser(event.detail.page.props ?? {});
        window.dispatchEvent(new Event('notifications:refresh'));
    });

    router.on('success', (event: any) => {
        syncAuthUser(event.detail.page.props ?? {});
    });
});

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

        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                window.dispatchEvent(new Event('notifications:refresh'));
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

    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.requestPermissions().then(({ receive }) => {
            if (receive !== 'granted') return;
            PushNotifications.register();
        });

        const postFcmToken = (token: string): Promise<boolean> =>
            axios.post('/push/fcm-token', { token })
                .then(() => true)
                .catch(() => false);

        let sendingFcmToken = false;

        const flushPendingToken = () => {
            if (sendingFcmToken) return;

            const pending = localStorage.getItem('_fcm_pending_token');
            if (!pending) return;

            sendingFcmToken = true;
            postFcmToken(pending).then((ok) => {
                sendingFcmToken = false;
                if (ok) {
                    try {
                        localStorage.removeItem('_fcm_pending_token');
                    } catch {}
                }
            });
        };

        PushNotifications.addListener('registration', ({ value: token }) => {
            try {
                localStorage.setItem('_fcm_pending_token', token);
            } catch {}
            flushPendingToken();
        });

        import('@inertiajs/core').then(({ router }) => {
            router.on('finish', flushPendingToken);
            router.on('navigate', flushPendingToken);
        });

        const dispatchNativeNotification = (payload: any) => {
            const notification = buildNotification(payload);
            const event = new CustomEvent<Notification>('capacitor-notification', { detail: notification });
            const queue = (window as any).__pendingCapacitorNotifications;

            if (Array.isArray(queue)) {
                queue.push(event);
            } else {
                window.dispatchEvent(event);
            }
        };

        PushNotifications.addListener('pushNotificationReceived', (push) => {
            dispatchNativeNotification(push);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const notification = buildNotification(action.notification);

            try {
                localStorage.setItem('_pending_native_notif', JSON.stringify(notification));
            } catch {}

            const event = new CustomEvent<Notification>('capacitor-notification', { detail: notification });
            const queue = (window as any).__pendingCapacitorNotifications;

            if (Array.isArray(queue)) {
                queue.push(event);
            } else {
                window.dispatchEvent(event);
            }

            const url = action.notification.data?.url;
            if (url) {
                window.location.href = url;
            }
        });
    });
});
