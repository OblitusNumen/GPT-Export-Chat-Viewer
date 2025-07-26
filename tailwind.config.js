/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // or 'media'
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    typography: {
        DEFAULT: {
            css: {
                code: {
                    'code::before': { content: 'none' },
                    'code::after': { content: 'none' },
                    backgroundColor: '#f3f4f6', // gray-100
                    padding: '0.2em 0.4em',
                    borderRadius: '0.25rem',
                    fontWeight: 'normal',
                },
            },
        },
        dark: {
            css: {
                code: {
                    backgroundColor: '#1f2937', // gray-800
                    color: '#e5e7eb', // gray-200
                },
            },
        },
    },
    plugins: [
        require('tailwind-scrollbar'),
        require('@tailwindcss/typography'),
    ],
}
