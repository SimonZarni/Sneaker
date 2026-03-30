import { router } from '@inertiajs/core';
import { useEffect } from 'react';

/**
 * useNativeTransition
 *
 * Adds instant visual tap-feedback on native so pages feel responsive
 * without waiting for the network round-trip.
 *
 * What it does:
 *  - On `touchstart`, immediately dims the tapped <a> or <button> (opacity 0.5)
 *    so the user sees a reaction in <16ms — well before Inertia fires.
 *  - Restores opacity once Inertia finishes or after a safety timeout.
 *
 * Usage: call once near the root of your app (e.g. in AuthenticatedLayout or Home).
 * It is a no-op on web because the CSS :active pseudo-class handles feedback there.
 */
export function useNativeTransition(): void {
    useEffect(() => {
        // Only wire up on native Capacitor — the Capacitor global is injected
        // before scripts run so this check is synchronous and safe.
        const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
        if (!isNative) return;

        let tappedElement: HTMLElement | null = null;
        let restoreTimer: ReturnType<typeof setTimeout> | null = null;

        const restoreOpacity = () => {
            if (restoreTimer) { clearTimeout(restoreTimer); restoreTimer = null; }
            if (tappedElement) {
                tappedElement.style.opacity = '';
                tappedElement = null;
            }
        };

        const onTouchStart = (e: TouchEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Walk up to find the nearest interactive element.
            const interactive = target.closest<HTMLElement>('a[href], button');
            if (!interactive) return;

            // Skip elements that should not dim (e.g. toggles, checkboxes).
            if (interactive.dataset.noTapFeedback !== undefined) return;

            restoreOpacity(); // clean up any previous tap
            tappedElement = interactive;
            interactive.style.opacity = '0.55';

            // Safety restore after 600ms in case finish never fires.
            restoreTimer = setTimeout(restoreOpacity, 600);
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });

        const unsubFinish = router.on('finish', restoreOpacity);
        const unsubError = router.on('error',  restoreOpacity);

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            unsubFinish();
            unsubError();
            restoreOpacity();
        };
    }, []);
}
