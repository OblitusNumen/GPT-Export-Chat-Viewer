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
    plugins: [
        require('tailwind-scrollbar'),
    ],
}

