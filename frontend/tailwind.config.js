/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mirror your existing CSS variables so Tailwind classes match the design system
      colors: {
        forest: {
          50:  '#f2f7f2',
          100: '#ddeedd',
          200: '#b8d9b8',
          300: '#7fba7f',
          400: '#4d9e4d',
          500: '#357a35',
          600: '#275f27',
          700: '#1d471d',
        },
        earth: {
          50:  '#faf7f2',
          100: '#f0e9db',
          200: '#ddd0ba',
          300: '#c4ae8e',
          400: '#a8895f',
          500: '#8a6d42',
          600: '#6e5530',
          700: '#523e21',
        },
        sand: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#111b10',  // sidebar dark bg
        },
        teal: {
          300: '#5eead4',
          400: '#2d9b90',
          500: '#1d7a70',
          600: '#0f5a52',
        },
        terra: {
          400: '#c95c20',
          500: '#b04e18',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      spacing: {
        sidebar: '240px',
        topbar:  '60px',
      },
      animation: {
        'slide-up':  'slideUp .35s cubic-bezier(.22,1,.36,1) both',
        'scale-in':  'scaleIn .3s cubic-bezier(.34,1.56,.64,1) both',
        'fade-in':   'fadeIn .3s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
}