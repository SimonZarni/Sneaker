import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AdminNotification {
    id: string;
    type: 'new_order' | 'new_message';
    title: string;
    message: string;
    icon: string;
    order_id?: number;
    conversation_id?: number;
    received_at: string;
    read: boolean;
}

interface AdminNotificationContextType {
    notifications: AdminNotification[];
    toast: AdminNotification | null;
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    dismissToast: () => void;
    deleteAll: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType>({
    notifications: [],
    toast: null,
    unreadCount: 0,
    markRead: () => {},
    markAllRead: () => {},
    dismissToast: () => {},
    deleteAll: () => {},
});

export function useAdminNotifications() {
    return useContext(AdminNotificationContext);
}

const STORAGE_KEY = 'admin_notifications';
const MAX_NOTIFICATIONS = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadFromStorage(): AdminNotification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed: AdminNotification[] = JSON.parse(raw);
        const cutoff = Date.now() - TTL_MS;

        return parsed.filter((n) => new Date(n.received_at).getTime() > cutoff);
    } catch {
        return [];
    }
}

function saveToStorage(notifications: AdminNotification[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
}

function sortNotifications(items: AdminNotification[]): AdminNotification[] {
    return [...items]
        .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
        .slice(0, MAX_NOTIFICATIONS);
}

function isAdminPage(): boolean {
    return window.location.pathname.startsWith('/admin');
}

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
        isAdminPage() ? sortNotifications(loadFromStorage()) : []
    );
    const [toast, setToast] = useState<AdminNotification | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscribedRef = useRef(false);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    const showToast = useCallback((notification: AdminNotification) => {
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

    const addNotification = useCallback((notification: AdminNotification) => {
        setNotifications((prev) => {
            const exists = prev.find((n) => n.id === notification.id);
            if (exists) return prev;

            const updated = sortNotifications([notification, ...prev]);
            saveToStorage(updated);
            return updated;
        });

        showToast(notification);
    }, [showToast]);

    // Subscribe to Pusher channels once Echo is available
    useEffect(() => {
        if (!isAdminPage()) return;
        if (subscribedRef.current) return;

        const trySubscribe = () => {
            if (typeof (window as any).Echo === 'undefined') return false;

            subscribedRef.current = true;

            // New orders channel
            (window as any).Echo.private('admin-notifications')
                .listen('.order.placed', (data: any) => {
                    addNotification({
                        id: `order-${data.id}`,
                        type: 'new_order',
                        title: 'New Order',
                        message: `Order ${data.order_number} from ${data.customer_name}`,
                        icon: '🛍️',
                        order_id: data.id,
                        received_at: new Date().toISOString(),
                        read: false,
                    });
                });

            // New chat messages channel (only from customers, not admin replies)
            (window as any).Echo.private('admin-chat')
                .listen('.chat.message', (data: any) => {
                    if (data.sender_type !== 'user') return;

                    addNotification({
                        id: `chat-${data.id}`,
                        type: 'new_message',
                        title: 'New Message',
                        message: `${data.user_name} sent a message`,
                        icon: '💬',
                        conversation_id: data.conversation_id,
                        received_at: new Date().toISOString(),
                        read: false,
                    });
                });

            return true;
        };

        // Echo may not be initialized yet if Pusher key is loading — retry briefly
        if (!trySubscribe()) {
            const interval = setInterval(() => {
                if (trySubscribe()) clearInterval(interval);
            }, 200);

            return () => {
                clearInterval(interval);
            };
        }

        return () => {
            if (subscribedRef.current) {
                try { (window as any).Echo.leave('admin-notifications'); } catch {}
                // Don't leave admin-chat — the Chat page also listens on it
                subscribedRef.current = false;
            }
        };
    }, [addNotification]);

    useEffect(() => {
        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => {
            const updated = prev.map((n) => ({ ...n, read: true }));
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const deleteAll = useCallback(() => {
        setNotifications([]);
        saveToStorage([]);
    }, []);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
            toastTimer.current = null;
        }
        setToast(null);
    }, []);

    return (
        <AdminNotificationContext.Provider value={{
            notifications,
            toast,
            unreadCount,
            markRead,
            markAllRead,
            dismissToast,
            deleteAll,
        }}>
            {children}
        </AdminNotificationContext.Provider>
    );
}
