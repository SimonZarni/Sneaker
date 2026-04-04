import React, { useEffect, useRef, useState } from 'react';
import { useAdminNotifications } from '@/Contexts/AdminNotificationContext';
import type { AdminNotification } from '@/Contexts/AdminNotificationContext';

export default function AdminNotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, deleteAll } = useAdminNotifications();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleClick = (notification: AdminNotification) => {
        markRead(notification.id);
        setOpen(false);

        if (notification.type === 'new_order' && notification.order_id) {
            window.location.href = `/admin/orders/${notification.order_id}`;
        } else {
            window.location.href = '/admin/chat';
        }
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
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    color: 'rgba(45,50,62,0.6)',
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
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: '0',
                    width: '320px',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                }}>
                    {/* Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    style={{ fontSize: '10px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteAll(); }}
                                    title="Delete all"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: '#9ca3af' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
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

                    {/* List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                                No notifications.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleClick(notification)}
                                    style={{
                                        padding: '12px 16px',
                                        display: 'flex',
                                        gap: '12px',
                                        borderBottom: '1px solid #f9fafb',
                                        cursor: 'pointer',
                                        backgroundColor: notification.read ? '#fff' : '#f8faff',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = notification.read ? '#fff' : '#f8faff')}
                                >
                                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{notification.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {notification.title}
                                            {!notification.read && (
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1', flexShrink: 0 }} />
                                            )}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {notification.message}
                                        </p>
                                        <span style={{ fontSize: '9px', color: '#9ca3af' }}>{timeAgo(notification.received_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
