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
                    // Core React libraries — shared by everything, cached longest
                    'vendor-react': ['react', 'react-dom'],

                    // Inertia — shared by all pages
                    'vendor-inertia': ['@inertiajs/react'],

                    // Admin pages — never loaded by regular customers
                    'chunk-admin': [
                        './resources/js/Pages/Admin/Dashboard.tsx',
                        './resources/js/Pages/Admin/Orders/Index.tsx',
                        './resources/js/Pages/Admin/Orders/Show.tsx',
                        './resources/js/Pages/Admin/Products/Index.tsx',
                        './resources/js/Pages/Admin/Products/Create.tsx',
                        './resources/js/Pages/Admin/Products/Edit.tsx',
                        './resources/js/Pages/Admin/Customers/Index.tsx',
                        './resources/js/Pages/Admin/Customers/Show.tsx',
                        './resources/js/Pages/Admin/Inventory/Index.tsx',
                        './resources/js/Pages/Admin/Reviews/Index.tsx',
                        './resources/js/Pages/Admin/Settings.tsx',
                        './resources/js/Pages/Admin/Login.tsx',
                    ],
                },
            },
        },
    },
});
