/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        border: '#374151',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
      },
    },
  },
  plugins: [],
};

