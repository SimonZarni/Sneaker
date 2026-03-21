import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    charcoal: '#5B8C5A',   // Sage green — primary
                    white: '#FFFFFF',
                    surface: '#EEF3EE',    // Light green-tinted surface
                    slate: '#2D4A31',      // Deep green — hover/secondary
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
            },
            letterSpacing: {
                tighter: '-0.05em',
                tightest: '-0.07em',
            },
            // --- ADDED ANIMATIONS ---
            animation: {
                'marquee-reverse': 'marquee-reverse 60s linear infinite',
            },
            keyframes: {
                'marquee-reverse': {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0%)' },
                },
            },
        },
    },
    plugins: [],
};
