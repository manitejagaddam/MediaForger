/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#111114',
        surfaceElevated: '#17171c',
        surfaceCard: '#141418',
        border: '#222227',
        borderMuted: '#1a1a20',
        primary: {
          DEFAULT: '#f4f4f5',
          hover: '#ffffff',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        accent: '#e4e4e7',
        muted: '#71717a',
      },
    },
  },
  plugins: [],
};
