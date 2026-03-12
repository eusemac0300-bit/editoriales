/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#137fec',
                    50: '#e8f2fd',
                    100: '#c6dffa',
                    200: '#9ec9f6',
                    300: '#6fb0f1',
                    400: '#4a9cee',
                    500: '#137fec',
                    600: '#0f6bd0',
                    700: '#0b54a8',
                    800: '#083e80',
                    900: '#052a5c',
                },
                dark: {
                    DEFAULT: '#0f1117',
                    50: '#1a1d27',
                    100: '#1e2130',
                    200: '#252837',
                    300: '#2d3040',
                    400: '#525666',
                    500: '#717584',
                    600: '#9498a4',
                    700: '#b1b4c1',
                    800: '#d5d7e2',
                    900: '#f8fafc',
                },
                surface: 'var(--bg-surface)',
                card: 'var(--bg-card)',
                'border-color': 'var(--border-color)',
            },
            fontFamily: {
                inter: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
