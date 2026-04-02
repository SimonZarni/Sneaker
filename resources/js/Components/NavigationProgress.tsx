import { useEffect, useRef, useState } from 'react';

export default function NavigationProgress() {
    const [active, setActive] = useState(false);
    const [width, setWidth] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        import('@inertiajs/core').then(({ router }) => {
            router.on('before', () => {
                if (hideRef.current) clearTimeout(hideRef.current);
                if (intervalRef.current) clearInterval(intervalRef.current);

                setActive(true);
                setWidth(0);

                let w = 0;
                intervalRef.current = setInterval(() => {
                    w = Math.min(w + Math.random() * 12 + 3, 85);
                    setWidth(w);
                }, 250);
            });

            router.on('finish', () => {
                if (intervalRef.current) clearInterval(intervalRef.current);

                setWidth(100);
                hideRef.current = setTimeout(() => {
                    setActive(false);
                    setWidth(0);
                }, 350);
            });
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (hideRef.current) clearTimeout(hideRef.current);
        };
    }, []);

    if (!active) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '2px',
                width: `${width}%`,
                background: '#0A0A0A',
                transition: width === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease-out',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        />
    );
}
