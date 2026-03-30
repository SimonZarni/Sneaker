import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@/Contexts/NotificationContext';
import { Capacitor } from '@capacitor/core';

export default function NotificationToast() {
    const { toast, dismissToast } = useNotifications();
    const [isMobile, setIsMobile] = useState(false);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!toast) return null;

    const handleClick = () => {
        dismissToast();
        window.location.href = `/orders/${toast.order_id}`;
    };

    const position: React.CSSProperties = {
        top: isNative
            ? 'calc(env(safe-area-inset-top, 0px) + 70px)'
            : '70px',
        right: '16px',
        left: 'auto',
        bottom: 'auto',
        width: isMobile ? 'calc(100vw - 32px)' : '320px',
    };

    const node = (
        <>
            <style>{`
                @keyframes toastSlideDown {
                    from { transform: translateY(-20px); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
            `}</style>

            <div
                onClick={handleClick}
                style={{
                    position: 'fixed',
                    ...position,
                    backgroundColor: '#fff',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    zIndex: 2147483647,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    animation: 'toastSlideDown 0.3s ease-out',
                    WebkitOverflowScrolling: 'auto',
                }}
            >
                <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
                    {toast.icon}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {toast.title}
                    </p>
                    <p style={{
                        fontSize: '11px',
                        color: '#4b5563',
                        lineHeight: 1.4,
                        margin: '2px 0 0',
                    }}>
                        {toast.message}
                    </p>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                    aria-label="Dismiss notification"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '14px',
                        lineHeight: 1,
                        padding: '0 0 0 4px',
                        flexShrink: 0,
                    }}
                >
                    ✕
                </button>
            </div>
        </>
    );

    return createPortal(node, document.body);
}
