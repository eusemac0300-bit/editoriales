/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
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
                    400: '#383b4a',
                    500: '#494c5b',
                    600: '#6b6e7d',
                    700: '#8e919f',
                    800: '#b1b4c1',
                    900: '#d5d7e2',
                }
            },
            fontFamily: {
                inter: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
