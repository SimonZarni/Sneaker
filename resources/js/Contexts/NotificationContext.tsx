import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export interface Notification {
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

interface NotificationContextType {
    notifications: Notification[];
    toast: Notification | null;
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    dismissToast: () => void;
    deleteAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    toast: null,
    unreadCount: 0,
    markRead: () => {},
    markAllRead: () => {},
    dismissToast: () => {},
    deleteAll: () => {},
});

export function useNotifications() {
    return useContext(NotificationContext);
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'sneaker_notifications_';
const TTL_MINUTES = 60;

function storageKey(userId: number): string {
    return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadFromStorage(userId: number): Notification[] {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return [];
        const parsed: Notification[] = JSON.parse(raw);
        const cutoff = Date.now() - TTL_MINUTES * 60 * 1000;
        return parsed.filter(n => new Date(n.received_at).getTime() > cutoff);
    } catch {
        return [];
    }
}

function saveToStorage(userId: number, notifications: Notification[]): void {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(notifications));
    } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
    userId: number | null;
    children: React.ReactNode;
}

export function NotificationProvider({ userId, children }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toast, setToast]                 = useState<Notification | null>(null);
    const toastTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscribedRef                     = useRef<number | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── 1. Load from localStorage on mount / userId change ───────────────────
    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            return;
        }
        const stored = loadFromStorage(userId);
        setNotifications(stored);
    }, [userId]);

    // ── 2. Save to localStorage whenever notifications change ─────────────────
    useEffect(() => {
        if (!userId) return;
        saveToStorage(userId, notifications);
    }, [notifications, userId]);

    // ── 3. Toast helper ───────────────────────────────────────────────────────
    const showToast = useCallback((notification: Notification) => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
            toastTimer.current = null;
        }
        setToast(notification);
        toastTimer.current = setTimeout(() => {
            setToast(null);
            toastTimer.current = null;
        }, 6000);
    }, []);

    // ── 4a. Capacitor native push listener ───────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        const handler = (e: Event) => {
            const notification = (e as CustomEvent<Notification>).detail;
            setNotifications(prev => {
                const exists = prev.some(n => n.id === notification.id);
                if (exists) return prev;
                return [notification, ...prev].slice(0, 20);
            });
            showToast(notification);
        };

        window.addEventListener('capacitor-notification', handler);

        // Drain any notifications that arrived before this component mounted
        const queue = (window as any).__pendingCapacitorNotifications;
        if (Array.isArray(queue)) {
            (window as any).__pendingCapacitorNotifications = null;
            queue.forEach((evt: CustomEvent) => handler(evt));
        }

        return () => window.removeEventListener('capacitor-notification', handler);
    }, [userId, showToast]);

    // ── 4b. Pusher subscription ───────────────────────────────────────────────
    useEffect(() => {
        // @ts-ignore
        if (!userId || typeof window.Echo === 'undefined') return;
        if (subscribedRef.current === userId) return;
        subscribedRef.current = userId;

        // @ts-ignore
        window.Echo.private(`orders.${userId}`)
            .listen('.order.status.changed', (data: any) => {
                const newNotification: Notification = {
                    id:              String(data.id) + '-' + data.type,
                    order_id:        data.id,
                    order_number:    data.order_number,
                    type:            data.type,
                    title:           data.title,
                    message:         data.message,
                    icon:            data.icon,
                    delivery_status: data.delivery_status,
                    received_at:     new Date().toISOString(),
                    read:            false,
                };

                setNotifications(prev => {
                    const exists = prev.some(n => n.id === newNotification.id);
                    if (exists) return prev;
                    return [newNotification, ...prev].slice(0, 20);
                });
                showToast(newNotification);
            });

        return () => {
            // @ts-ignore
            window.Echo.leave(`orders.${userId}`);
            subscribedRef.current = null;
        };
    }, [userId, showToast]);

    // Cleanup toast timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    // ── 5. Actions ────────────────────────────────────────────────────────────
    const markRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const deleteAll = useCallback(() => {
        setNotifications([]);
        if (userId) {
            try { localStorage.removeItem(storageKey(userId)); } catch {}
        }
    }, [userId]);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(null);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            toast,
            unreadCount,
            markRead,
            markAllRead,
            dismissToast,
            deleteAll,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
