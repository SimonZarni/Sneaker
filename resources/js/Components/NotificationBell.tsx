import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/Contexts/NotificationContext';

interface Props {
    userId?: number;
}

export default function NotificationBell(_: Props) {
    const {
        notifications,
        toast,
        unreadCount,
        markRead,
        markAllRead,
        dismissToast,
        deleteAll,
    } = useNotifications();

    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleNotificationClick = (notification: { id: string; order_id: number }) => {
        markRead(notification.id);
        setOpen(false);
        window.location.href = `/orders/${notification.order_id}`;
    };

    const handleToastClick = (notification: { order_id: number }) => {
        dismissToast();
        window.location.href = `/orders/${notification.order_id}`;
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

    const containerStyles: React.CSSProperties = isMobile
        ? {
            position: 'fixed',
            top: '70px',
            left: '10px',
            right: '10px',
            width: 'auto',
            zIndex: 1000,
        }
        : {
            position: 'absolute',
            top: 'calc(100% + 15px)',
            right: '0',
            width: '320px',
            zIndex: 1000,
        };

    return (
        <>
            <div ref={dropdownRef} style={{ position: isMobile ? 'static' : 'relative', display: 'inline-block' }}>
                <button
                    onClick={() => setOpen((value) => !value)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        color: 'inherit',
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>

                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 900,
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #fff',
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {open && (
                    <div style={{
                        ...containerStyles,
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Notifications</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ fontSize: '10px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={(event) => { event.stopPropagation(); deleteAll(); }}
                                        title="Delete all notifications"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#9ca3af' }}
                                        onMouseEnter={(event) => (event.currentTarget.style.color = '#ef4444')}
                                        onMouseLeave={(event) => (event.currentTarget.style.color = '#9ca3af')}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                            <path d="M10 11v6M14 11v6" />
                                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '30px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>No notifications.</div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            gap: '12px',
                                            borderBottom: '1px solid #f9fafb',
                                            cursor: 'pointer',
                                            backgroundColor: notification.read ? '#fff' : '#f8faff',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{notification.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{notification.title}</p>
                                            <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0' }}>{notification.message}</p>
                                            <span style={{ fontSize: '9px', color: '#9ca3af' }}>{timeAgo(notification.received_at)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {toast && (
                <div
                    onClick={() => handleToastClick(toast)}
                    style={{
                        position: 'fixed',
                        top: isMobile ? '16px' : 'auto',
                        bottom: isMobile ? 'auto' : '20px',
                        right: '20px',
                        left: isMobile ? '20px' : 'auto',
                        width: isMobile ? 'auto' : '320px',
                        backgroundColor: '#111827',
                        color: '#fff',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        animation: isMobile ? 'toastSlideDown 0.3s ease-out' : 'toastSlideUp 0.3s ease-out',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>{toast.icon}</span>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>{toast.title}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{toast.message}</p>
                    </div>
                    <button
                        onClick={(event) => { event.stopPropagation(); dismissToast(); }}
                        style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}
                    >✕</button>
                </div>
            )}

            <style>{`
                @keyframes toastSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes toastSlideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
