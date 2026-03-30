import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@/Contexts/NotificationContext';
import { Capacitor } from '@capacitor/core';

/**
 * NotificationToast — global, portal-based toast.
 *
 * Mounted once at the app root (inside NotificationProvider, outside every
 * page component). Rendered via createPortal directly onto document.body so
 * it is never a child of any stacking context created by the nav
 * (backdrop-filter, transform, opacity < 1, etc.) — the exact cause of the
 * toast being invisible on native WebView while working fine on web.
 *
 * Safe-area insets are applied so the toast clears the status bar / home
 * indicator on Android and iOS.
 */
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

    /**
     * Positioning strategy:
     *
     * Native top placement:  below the status bar via env(safe-area-inset-top)
     * Native bottom placement: above the home indicator via env(safe-area-inset-bottom)
     * Web mobile: top (slide down)
     * Web desktop: bottom-right (slide up)
     *
     * z-index 2147483647 is the theoretical maximum for a 32-bit integer —
     * guaranteed to sit above every other layer including Capacitor overlays.
     */
    const position: React.CSSProperties = {
        top: isNative
            ? 'calc(env(safe-area-inset-top, 0px) + 70px)'
            : '70px',
        right: '16px',
        left: 'auto',
        bottom: 'auto',
        width: isMobile ? 'calc(100vw - 32px)' : '320px',
    };

    const animationName = 'toastSlideDown';

    const node = (
        <>
            <style>{`
                @keyframes toastSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
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
                    backgroundColor: '#111827',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    zIndex: 2147483647,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    animation: `${animationName} 0.3s ease-out`,
                    // Prevent the WebView from treating this as a scrollable element
                    WebkitOverflowScrolling: 'auto',
                }}
            >
                <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>
                    {toast.icon}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        marginBottom: '2px',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {toast.title}
                    </p>
                    <p style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.7)',
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
                        color: '#fff',
                        opacity: 0.5,
                        cursor: 'pointer',
                        fontSize: '16px',
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

    // Portal to document.body — escapes every stacking context in the page tree.
    return createPortal(node, document.body);
}
