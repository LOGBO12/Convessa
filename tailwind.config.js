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
          50: '#e6f4f3',
          100: '#b3ddd9',
          200: '#80c6bf',
          300: '#4dafa5',
          400: '#2a9b9f',
          500: '#128C7E', // Couleur turquoise unique
          600: '#107d71',
          700: '#0d6459',
          800: '#0a4b42',
          900: '#07322a',
        },
        whatsapp: {
          light: '#2a9b9f',
          DEFAULT: '#128C7E',
          dark: '#128C7E',
          darker: '#0d6459',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
