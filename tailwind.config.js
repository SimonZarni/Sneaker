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
                    charcoal: '#0A0A0A',
                    white: '#FFFFFF',
                    surface: '#F5F5F7',
                    slate: '#2D323E',
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
