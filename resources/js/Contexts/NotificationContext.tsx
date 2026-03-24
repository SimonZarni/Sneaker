import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

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
    const [toast, setToast] = useState<Notification | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscribedRef = useRef<number | null>(null);

    // Derived State: unreadCount is automatically recalculated whenever notifications array changes
    const unreadCount = notifications.filter(n => !n.read).length;

    // ─── 1. INITIAL FETCH ───
    // When the user logs in, pull their notification history from the database
    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            return;
        }

        axios.get('/api/notifications')
            .then(res => {
                // Ensure the incoming data matches our Notification interface
                setNotifications(res.data);
            })
            .catch(err => console.error("Could not load notification history", err));
    }, [userId]);

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

    // ─── 2. PUSHER SUBSCRIPTION ───
    useEffect(() => {
        // @ts-ignore
        if (!userId || typeof window.Echo === 'undefined') return;

        // Prevent duplicate subscriptions for the same user
        if (subscribedRef.current === userId) return;
        subscribedRef.current = userId;

        // @ts-ignore
        window.Echo.private(`orders.${userId}`)
            .listen('.order.status.changed', (data: any) => {
                const newNotification: Notification = {
                    id: `${data.id}-${Date.now()}`, // Unique ID for React keys
                    order_id: data.id,
                    order_number: data.order_number,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    icon: data.icon,
                    delivery_status: data.delivery_status,
                    received_at: new Date().toISOString(),
                    read: false,
                };

                // Prepend new notification to the top of the list
                setNotifications(prev => [newNotification, ...prev].slice(0, 20));
                showToast(newNotification);
            });

        return () => {
            // @ts-ignore
            window.Echo.leave(`orders.${userId}`);
            subscribedRef.current = null;
        };
    }, [userId, showToast]);

    // ─── 3. ACTIONS ───

    const markRead = useCallback(async (id: string) => {
        // OPTIMISTIC UPDATE: Change UI state immediately so dots disappear instantly
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        // SYNC WITH BACKEND: Send the update to Laravel
        try {
            await axios.post(`/api/notifications/${id}/read`);
        } catch (err) {
            console.error("Failed to mark notification as read in DB", err);
            // Optional: Rollback UI state if the request fails
        }
    }, []);

    const markAllRead = useCallback(async () => {
        // OPTIMISTIC UPDATE
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // SYNC WITH BACKEND
        try {
            await axios.post('/api/notifications/read-all');
        } catch (err) {
            console.error("Failed to mark all as read in DB", err);
        }
    }, []);

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
            dismissToast
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
