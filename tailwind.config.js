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
          DEFAULT: '#cc1a1a',
          50:  '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc5c5',
          300: '#ff9494',
          400: '#ff5252',
          500: '#ff2424',
          600: '#f00000',
          700: '#cc0000',
          800: '#aa0000',
          900: '#8B0000',
          950: '#450a0a',
        },
        surface: {
          DEFAULT: '#13171b',
          deep:    '#0c0e10',
          raised:  '#1a1f25',
          hover:   '#20262e',
          line:    '#252c35',
        },
        gold:   '#f5a623',
        silver: '#9fb3c8',
        bronze: '#cd7f32',
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 14px rgba(204, 26, 26, 0.25)',
        'glow':    '0 0 28px rgba(204, 26, 26, 0.35)',
        'glow-lg': '0 0 48px rgba(204, 26, 26, 0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-up':    'fadeUp 0.35s ease-out',
        'fade-in':    'fadeIn 0.25s ease-out',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'slide-right':'slideRight 0.2s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(204,26,26,0.3)' },
          '50%':      { boxShadow: '0 0 28px rgba(204,26,26,0.6)' },
        },
        slideRight: {
          '0%':   { transform: 'translateX(-6px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
