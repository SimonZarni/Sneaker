import React, { useState, useEffect } from 'react';
import { usePwa } from '@/hooks/usePwa';

// Don't show the banner if dismissed within the last 7 days
const DISMISS_KEY = 'sneaker_install_dismissed';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function wasDismissed(): boolean {
    try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        return Date.now() - parseInt(raw, 10) < DISMISS_TTL;
    } catch {
        return false;
    }
}

export default function InstallBanner() {
    const { isInstallable, isInstalled, promptInstall } = usePwa();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Delay slightly so it doesn't pop immediately on page load
        const t = setTimeout(() => {
            if (isInstallable && !isInstalled && !wasDismissed()) {
                setVisible(true);
            }
        }, 3000);
        return () => clearTimeout(t);
    }, [isInstallable, isInstalled]);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    };

    const handleInstall = () => {
        promptInstall();
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop on mobile */}
            <div
                onClick={handleDismiss}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 9990,
                    display: 'none',
                }}
                className="sneaker-install-backdrop"
            />

            {/* Banner */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9991,
                    animation: 'installSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                {/* Mobile: full bottom sheet */}
                <div className="block sm:hidden" style={{
                    background: '#F5F5F7',
                    borderRadius: '20px 20px 0 0',
                    padding: '8px 20px 32px',
                }}>
                    {/* Drag handle */}
                    <div style={{
                        width: 36, height: 4,
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: 2,
                        margin: '12px auto 20px',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        {/* App icon placeholder — replace with your actual icon */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: '#0A0A0A',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ color: '#F5F5F7', fontSize: 13, fontWeight: 900, letterSpacing: '.1em' }}>S.D</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-.01em' }}>SNEAKER.DRP</div>
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Add to Home Screen for the full experience</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                            onClick={handleInstall}
                            style={{
                                background: '#0A0A0A',
                                color: '#F5F5F7',
                                border: 'none',
                                padding: '14px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 900,
                                letterSpacing: '.1em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            Add to Home Screen
                        </button>
                        <button
                            onClick={handleDismiss}
                            style={{
                                background: 'transparent',
                                color: '#888',
                                border: 'none',
                                padding: '12px',
                                fontSize: 12,
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            Not now
                        </button>
                    </div>
                </div>

                {/* Desktop: slim bar at bottom */}
                <div className="hidden sm:block" style={{
                    background: '#0A0A0A',
                    borderTop: '1px solid #1a1a1a',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 600,
                    margin: '0 auto',
                    borderRadius: '12px 12px 0 0',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: '#1a1a1a', border: '1px solid #333',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ color: '#F5F5F7', fontSize: 9, fontWeight: 900, letterSpacing: '.08em' }}>S.D</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F7' }}>Install SNEAKER.DRP</div>
                            <div style={{ fontSize: 10, color: 'rgba(245,245,247,.4)', marginTop: 1 }}>Fast, offline-ready, native feel</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={handleInstall}
                            style={{
                                background: '#F5F5F7',
                                color: '#0A0A0A',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 900,
                                letterSpacing: '.1em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                            }}
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            style={{
                                background: 'none', border: 'none',
                                color: 'rgba(245,245,247,.4)',
                                cursor: 'pointer',
                                padding: '6px 8px',
                                fontSize: 16,
                                lineHeight: 1,
                            }}
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes installSlideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
