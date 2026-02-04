/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#10b981', // emerald-500
                    light: '#34d399',   // emerald-400
                    dark: '#059669',    // emerald-600
                },
                background: '#0f172a', // slate-900
                card: '#1e293b',      // slate-800
            },
        },
    },
    plugins: [],
}
