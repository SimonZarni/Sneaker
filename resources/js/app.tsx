import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import NotificationToast from '@/Components/NotificationToast';

interface AppNotification {
    id: string;
    order_id: number;
    order_number: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    delivery_status: string;
    received_at: string;
    read: boolean;
}

(window as any).__authUserId = null as number | null;

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const syncAuthUser = (pageProps: any) => {
    const userId = pageProps?.auth?.user?.id ?? null;
    (window as any).__authUserId = userId;
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { userId } }));
};

const buildNotification = (payload: any): AppNotification => {
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

const dispatchNotificationsRefresh = () => {
    window.dispatchEvent(new Event('notifications:refresh'));
};

const dispatchNotificationsRefreshTwice = () => {
    dispatchNotificationsRefresh();

    window.setTimeout(() => {
        dispatchNotificationsRefresh();
    }, 1200);
};

const emitNativeNotification = (notification: AppNotification) => {
    const event = new CustomEvent<AppNotification>('capacitor-notification', { detail: notification });
    // Always dispatch directly. The queue in NotificationContext only drains
    // once on mount — if we keep pushing into the array after mount the events
    // are never consumed and the toast never fires.
    window.dispatchEvent(event);
};

const pushBellAndRefresh = (payload: any) => {
    const notification = buildNotification(payload);
    emitNativeNotification(notification);
    dispatchNotificationsRefreshTwice();
    return notification;
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
                <NotificationToast />
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
        dispatchNotificationsRefresh();
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
                dispatchNotificationsRefreshTwice();
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

        PushNotifications.addListener('pushNotificationReceived', (push) => {
            pushBellAndRefresh(push);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            const notification = pushBellAndRefresh(action.notification);

            try {
                localStorage.setItem('_pending_native_notif', JSON.stringify(notification));
            } catch {}

            const url = action.notification.data?.url;
            if (url) {
                window.location.href = url;
            }
        });
    });
});
