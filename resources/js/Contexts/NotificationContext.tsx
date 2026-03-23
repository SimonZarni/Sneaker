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
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    toast: null,
    unreadCount: 0,
    markRead: () => {},
    markAllRead: () => {},
    dismissToast: () => {},
});

export function useNotifications() {
    return useContext(NotificationContext);
}

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

    // ── Subscribe to Pusher — only when userId is set and not already subscribed ──
    useEffect(() => {
        // @ts-ignore
        if (!userId || typeof window.Echo === 'undefined') return;

        // Already subscribed for this user — don't re-subscribe
        if (subscribedRef.current === userId) return;
        subscribedRef.current = userId;

        // @ts-ignore
        window.Echo.private(`orders.${userId}`)
            .listen('.order.status.changed', (data: any) => {
                const notification: Notification = {
                    id:              `${data.id}-${data.type}-${Date.now()}`,
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
                setNotifications(prev => [notification, ...prev].slice(0, 20));
                showToast(notification);
            });

        return () => {
            // Only leave channel when userId actually changes (e.g. logout)
            // @ts-ignore
            window.Echo.leave(`orders.${userId}`);
            subscribedRef.current = null;
        };
    }, [userId]);

    // Cleanup toast timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, toast, unreadCount, markRead, markAllRead, dismissToast }}>
            {children}
        </NotificationContext.Provider>
    );
}
