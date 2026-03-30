import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

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
    refresh: () => Promise<void>;
}

declare global {
    interface Window {
        __authUserId?: number | null;
        __pendingCapacitorNotifications?: CustomEvent<Notification>[] | null;
    }
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    toast: null,
    unreadCount: 0,
    markRead: () => {},
    markAllRead: () => {},
    dismissToast: () => {},
    deleteAll: () => {},
    refresh: async () => {},
});

export function useNotifications() {
    return useContext(NotificationContext);
}

function getCurrentAuthUserId(): number | null {
    const value = window.__authUserId;
    return typeof value === 'number' ? value : null;
}

function sortNotifications(items: Notification[]): Notification[] {
    return [...items]
        .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
        .slice(0, 8);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toast, setToast] = useState<Notification | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(() => getCurrentAuthUserId());
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const subscribedRef = useRef<number | null>(null);
    const isNative = Capacitor.isNativePlatform();

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

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

    const mergeNotifications = useCallback((incoming: Notification[], showToastForNew = false) => {
        if (!incoming.length) return;

        setNotifications((prev) => {
            const prevIds = new Set(prev.map((item) => item.id));
            const merged = new Map<string, Notification>();

            [...incoming, ...prev].forEach((item) => {
                const existing = merged.get(item.id);

                if (!existing) {
                    merged.set(item.id, item);
                    return;
                }

                merged.set(item.id, {
                    ...existing,
                    ...item,
                    read: existing.read || item.read,
                });
            });

            const next = sortNotifications(Array.from(merged.values()));

            if (showToastForNew) {
                const newestNew = incoming.find((item) => !prevIds.has(item.id));
                if (newestNew) {
                    showToast(newestNew);
                }
            }

            return next;
        });
    }, [showToast]);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setToast(null);
    }, []);

    const refresh = useCallback(async () => {
        const userId = getCurrentAuthUserId();
        setCurrentUserId(userId);

        if (!userId) {
            clearNotifications();
            return;
        }

        try {
            const { data } = await axios.get<Notification[]>('/notifications');
            setNotifications(sortNotifications(data));
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                clearNotifications();
                return;
            }

            console.error('Failed to refresh notifications', error);
        }
    }, [clearNotifications]);

    useEffect(() => {
        refresh().catch(() => {});
    }, [refresh]);

    useEffect(() => {
        const handleAuthChanged = (event: Event) => {
            const userId = (event as CustomEvent<{ userId: number | null }>).detail?.userId ?? null;
            setCurrentUserId(userId);

            if (!userId) {
                clearNotifications();
                return;
            }

            refresh().catch(() => {});
        };

        const handleRefresh = () => {
            refresh().catch(() => {});
        };

        const handleNativeNotification = (event: Event) => {
            const notification = (event as CustomEvent<Notification>).detail;
            mergeNotifications([notification], true);
            refresh().catch(() => {});
        };

        window.addEventListener('auth-state-changed', handleAuthChanged as EventListener);
        window.addEventListener('notifications:refresh', handleRefresh);
        window.addEventListener('capacitor-notification', handleNativeNotification as EventListener);

        const queue = window.__pendingCapacitorNotifications;
        if (Array.isArray(queue) && queue.length > 0) {
            const snapshot = [...queue];
            window.__pendingCapacitorNotifications = null;
            snapshot.forEach((queuedEvent) => handleNativeNotification(queuedEvent));
        }

        const pendingRaw = localStorage.getItem('_pending_native_notif');
        if (pendingRaw) {
            try {
                const pendingNotification = JSON.parse(pendingRaw) as Notification;
                handleNativeNotification(new CustomEvent<Notification>('capacitor-notification', { detail: pendingNotification }));
            } catch (error) {
                console.error('Failed to parse _pending_native_notif', error);
            } finally {
                localStorage.removeItem('_pending_native_notif');
            }
        }

        return () => {
            window.removeEventListener('auth-state-changed', handleAuthChanged as EventListener);
            window.removeEventListener('notifications:refresh', handleRefresh);
            window.removeEventListener('capacitor-notification', handleNativeNotification as EventListener);
        };
    }, [clearNotifications, mergeNotifications, refresh]);

    useEffect(() => {
        if (isNative) return;
        if (!currentUserId || typeof (window as any).Echo === 'undefined') return;
        if (subscribedRef.current === currentUserId) return;

        subscribedRef.current = currentUserId;

        (window as any).Echo.private(`orders.${currentUserId}`)
            .listen('.order.status.changed', (data: any) => {
                const notification: Notification = {
                    id: `${data.id}-${data.type}`,
                    order_id: Number(data.id),
                    order_number: data.order_number,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    icon: data.icon,
                    delivery_status: data.delivery_status,
                    received_at: new Date().toISOString(),
                    read: false,
                };

                mergeNotifications([notification], true);
                refresh().catch(() => {});
            });

        return () => {
            (window as any).Echo.leave(`orders.${currentUserId}`);
            subscribedRef.current = null;
        };
    }, [currentUserId, isNative, mergeNotifications, refresh]);

    useEffect(() => {
        return () => {
            if (toastTimer.current) {
                clearTimeout(toastTimer.current);
            }
        };
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read: true } : item));
        axios.post(`/notifications/${encodeURIComponent(id)}/read`).catch((error) => {
            console.error('Failed to mark notification as read', error);
            refresh().catch(() => {});
        });
    }, [refresh]);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
        axios.post('/notifications/read-all').catch((error) => {
            console.error('Failed to mark all notifications as read', error);
            refresh().catch(() => {});
        });
    }, [refresh]);

    const deleteAll = useCallback(() => {
        setNotifications([]);
        axios.delete('/notifications').catch((error) => {
            console.error('Failed to delete notifications', error);
            refresh().catch(() => {});
        });
    }, [refresh]);

    const dismissToast = useCallback(() => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
            toastTimer.current = null;
        }

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
            refresh,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
