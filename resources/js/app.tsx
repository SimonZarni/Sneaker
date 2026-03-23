import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { NotificationProvider } from '@/Contexts/NotificationContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Extract userId from shared Inertia props so NotificationProvider
        // can subscribe to the correct Pusher channel.
        // Cast to any because PageProps typing doesn't include our custom auth shape.
        const userId = (props.initialPage.props as any)?.auth?.user?.id ?? null;

        root.render(
            <NotificationProvider userId={userId}>
                <App {...props} />
            </NotificationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
