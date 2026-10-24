/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#f4f6fb',
        card: '#ffffff',
        border: '#e2e8f0',
        primary: {
          DEFAULT: '#1e1b4b', // Deep indigo
          hover: '#2d2870',
          brand: '#2563eb', // Vibrant indigo/blue for brand logo
          light: '#eef2ff'
        },
        lost: {
          DEFAULT: '#ea580c',
          text: '#ea580c',
          bg: '#ffedd5',
          border: '#fed7aa'
        },
        found: {
          DEFAULT: '#059669',
          text: '#059669',
          bg: '#d1fae5',
          border: '#a7f3d0'
        },
        returned: {
          text: '#64748b',
          bg: '#f1f5f9',
          border: '#cbd5e1'
        },
        match: {
          strong: '#059669',
          good: '#2563eb',
          possible: '#64748b'
        },
        chip: {
          categoryBg: '#ede9fe',
          categoryText: '#4f46e5',
          colorBg: '#e0f2fe',
          colorText: '#0284c7',
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
