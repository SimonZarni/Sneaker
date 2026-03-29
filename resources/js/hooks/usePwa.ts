import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────

interface PwaState {
    isInstallable: boolean;
    isInstalled: boolean;
    isPushSupported: boolean;
    pushSubscribed: boolean;
    promptInstall: () => void;
    subscribeToPush: () => Promise<void>;
    unsubscribeFromPush: () => Promise<void>;
}

// ── VAPID public key from env ──────────────────────────────────────────────
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// ── Native platform detection ──────────────────────────────────────────────
// Resolved once at module load — avoids async Capacitor import inside the hook.
// On native (Android/iOS) we skip web push entirely; FCM handles notifications.
// The service worker is still registered for offline/caching purposes.
let _isNative = false;
import('@capacitor/core')
    .then(({ Capacitor }) => { _isNative = Capacitor.isNativePlatform(); })
    .catch(() => {});

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return view;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function usePwa(): PwaState {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [isNative, setIsNative] = useState(_isNative);

    // Sync _isNative once Capacitor resolves (handles the async module load).
    useEffect(() => {
        import('@capacitor/core')
            .then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()))
            .catch(() => {});
    }, []);

    // Web push is only meaningful on non-native platforms.
    // On native the app receives pushes via FCM; a web push subscription
    // would cause every notification to appear twice (once via FCM, once via
    // the service worker's push event handler).
    const isPushSupported =
        !isNative &&
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        !!VAPID_PUBLIC_KEY;

    // ── Register service worker ────────────────────────────────────────────
    // Always register — the SW is needed for offline caching regardless of
    // whether web push is supported or the platform is native.
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                console.log('[PWA] Service worker registered', registration.scope);
            })
            .catch((err) => {
                console.warn('[PWA] Service worker registration failed:', err);
            });
    }, []);

    // ── Detect install state ───────────────────────────────────────────────
    useEffect(() => {
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setIsInstalled(isStandalone);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // ── Check existing push subscription ──────────────────────────────────
    useEffect(() => {
        if (!isPushSupported) return;

        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setPushSubscribed(!!sub);
            });
        });
    }, [isPushSupported]);

    // ── Trigger install prompt ─────────────────────────────────────────────
    const promptInstall = useCallback(() => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true);
                setIsInstallable(false);
            }
            setDeferredPrompt(null);
        });
    }, [deferredPrompt]);

    // ── Subscribe to push ──────────────────────────────────────────────────
    const subscribeToPush = useCallback(async () => {
        // Guard: native app uses FCM — creating a web push subscription here
        // would result in duplicate system notifications (one from FCM, one
        // from the service worker's push handler).
        if (isNative) return;
        if (!isPushSupported || !VAPID_PUBLIC_KEY) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            await axios.post('/push/subscribe', {
                subscription: subscription.toJSON(),
            });

            setPushSubscribed(true);
        } catch (err) {
            console.warn('[PWA] Push subscription failed:', err);
        }
    }, [isPushSupported, isNative]);

    // ── Unsubscribe from push ──────────────────────────────────────────────
    const unsubscribeFromPush = useCallback(async () => {
        if (isNative) return;
        if (!isPushSupported) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await axios.post('/push/unsubscribe', {
                    endpoint: subscription.endpoint,
                });
            }

            setPushSubscribed(false);
        } catch (err) {
            console.warn('[PWA] Push unsubscribe failed:', err);
        }
    }, [isPushSupported, isNative]);

    return {
        isInstallable,
        isInstalled,
        isPushSupported,
        pushSubscribed,
        promptInstall,
        subscribeToPush,
        unsubscribeFromPush,
    };
}
