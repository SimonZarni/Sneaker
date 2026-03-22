import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React libraries — cached longest, never change
                    'vendor-react': ['react', 'react-dom'],
                    // Inertia — shared by all pages
                    'vendor-inertia': ['@inertiajs/react'],
                },
            },
        },
    },
});
