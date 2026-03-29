import React, { useState, useEffect } from 'react';
import { usePwa } from '@/hooks/usePwa';

interface Props {
    /** Pass true if the user already has a stored subscription in the DB */
    initialSubscribed?: boolean;
}

export default function PushNotificationToggle({ initialSubscribed = false }: Props) {
    const { isPushSupported, pushSubscribed, subscribeToPush, unsubscribeFromPush } = usePwa();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNative, setIsNative] = useState(false);

    // Detect native platform to hide this toggle entirely.
    // On native (Android/iOS), FCM handles push notifications — the web push
    // subscription toggle is irrelevant and showing it would confuse users.
    useEffect(() => {
        import('@capacitor/core')
            .then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()))
            .catch(() => {});
    }, []);

    // Hide on native — FCM notifications are always-on and managed by the OS.
    if (isNative) return null;

    const isOn = pushSubscribed || initialSubscribed;

    const handleToggle = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isOn) {
                await unsubscribeFromPush();
            } else {
                await subscribeToPush();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Browser doesn't support web push (e.g. iOS Safari pre-16.4)
    if (!isPushSupported) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>Push Notifications</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                        Not supported in this browser
                    </div>
                </div>
                <div style={{
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: '#f3f4f6',
                    color: '#9ca3af',
                    fontWeight: 600,
                    letterSpacing: '.05em',
                }}>
                    UNAVAILABLE
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>Push Notifications</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {isOn
                        ? 'Order updates sent to this device'
                        : 'Get notified about order status changes'}
                </div>
                {error && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</div>
                )}
            </div>

            {/* Toggle switch */}
            <button
                onClick={handleToggle}
                disabled={loading}
                aria-pressed={isOn}
                aria-label="Toggle push notifications"
                style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    background: isOn ? '#0A0A0A' : '#e5e7eb',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                    opacity: loading ? 0.6 : 1,
                    padding: 0,
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: 2,
                    left: isOn ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                }} />
            </button>
        </div>
    );
}
