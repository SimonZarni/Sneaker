import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface Notification {
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

interface Props {
    userId: number;
}

export default function NotificationBell({ userId }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Subscribe to Pusher private channel ───────────────────────────────────
    useEffect(() => {
        // @ts-ignore — Echo is loaded globally via bootstrap.ts
        if (typeof window.Echo === 'undefined') return;

        // @ts-ignore
        const channel = window.Echo.private(`orders.${userId}`)
            .listen('.order.status.changed', (data: any) => {
                const notification: Notification = {
                    id:              `${data.order_id}-${data.type}-${Date.now()}`,
                    order_id:        data.order_id,
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
            // @ts-ignore
            window.Echo.leave(`orders.${userId}`);
        };
    }, [userId]);

    // ── Close dropdown on outside click ──────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const showToast = useCallback((notification: Notification) => {
        setToast(notification);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 5000);
    }, []);

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (notification: Notification) => {
        markRead(notification.id);
        setOpen(false);
        router.visit(`/orders/${notification.order_id}`);
    };

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <>
            {/* Bell button */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setOpen(v => !v)}
                    style={{
                        position: 'relative', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '4px', display: 'flex',
                        alignItems: 'center', color: 'inherit',
                    }}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '-4px', right: '-4px',
                            backgroundColor: '#ef4444', color: '#fff',
                            fontSize: '8px', fontWeight: 900,
                            width: '16px', height: '16px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {open && (
                    <div style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                        width: '320px', backgroundColor: '#fff',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 100,
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0a0a0a' }}>
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(45,50,62,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(45,50,62,0.3)', fontSize: '11px', fontWeight: 600 }}>
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        style={{
                                            display: 'flex', gap: '10px', padding: '12px 16px',
                                            borderBottom: '1px solid #f5f5f7', cursor: 'pointer',
                                            backgroundColor: n.read ? '#fff' : 'rgba(59,130,246,0.04)',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? '#fff' : 'rgba(59,130,246,0.04)')}
                                    >
                                        {/* Unread dot */}
                                        <div style={{ paddingTop: '6px', flexShrink: 0 }}>
                                            <div style={{
                                                width: '7px', height: '7px', borderRadius: '50%',
                                                backgroundColor: n.read ? 'transparent' : '#3b82f6',
                                            }} />
                                        </div>
                                        {/* Icon */}
                                        <div style={{ fontSize: '20px', flexShrink: 0 }}>{n.icon}</div>
                                        {/* Body */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a', marginBottom: '2px' }}>{n.title}</p>
                                            <p style={{ fontSize: '10px', color: 'rgba(45,50,62,0.6)', lineHeight: 1.5 }}>{n.message}</p>
                                            <p style={{ fontSize: '9px', color: 'rgba(45,50,62,0.35)', marginTop: '3px', fontWeight: 600 }}>{timeAgo(n.received_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div
                            onClick={() => { setOpen(false); router.visit('/orders'); }}
                            style={{
                                padding: '10px 16px', textAlign: 'center',
                                fontSize: '9px', fontWeight: 900, textTransform: 'uppercase',
                                letterSpacing: '0.1em', color: 'rgba(45,50,62,0.4)',
                                cursor: 'pointer', borderTop: '1px solid #f0f0f0',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#0a0a0a')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(45,50,62,0.4)')}
                        >
                            View all orders →
                        </div>
                    </div>
                )}
            </div>

            {/* Toast popup */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    backgroundColor: '#0a0a0a', color: '#fff',
                    padding: '14px 16px', zIndex: 9999,
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    maxWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    animation: 'slideUp 0.3s ease',
                }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{toast.icon}</span>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{toast.title}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{toast.message}</p>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', flexShrink: 0, padding: 0 }}
                    >
                        ✕
                    </button>
                    <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
                </div>
            )}
        </>
    );
}
