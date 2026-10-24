/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#f8fafc',
        card: '#ffffff',
        border: '#e2e8f0',
        primary: {
          DEFAULT: '#4338ca',
          hover: '#3730a3'
        },
        lost: {
          text: '#d97706',
          bg: '#fef3c7'
        },
        found: {
          text: '#0d9488',
          bg: '#ccfbf1'
        },
        returned: {
          text: '#6b7280',
          bg: '#f3f4f6'
        },
        match: {
          strong: '#16a34a',
          good: '#2563eb',
          possible: '#64748b'
        },
        chip: {
          text: '#0369a1',
          bg: '#e0f2fe'
        },
        text: {
          main: '#0f172a',
          muted: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
