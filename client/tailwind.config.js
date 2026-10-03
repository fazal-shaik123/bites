/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pastel: {
          rose: '#ffe4e6',
          roseDark: '#fb7185',
          peach: '#ffedd5',
          peachDark: '#fb923c',
          lavender: '#f3e8ff',
          lavenderDark: '#c084fc',
          mint: '#dcfce7',
          mintDark: '#4ade80',
          sky: '#e0f2fe',
          skyDark: '#38bdf8',
          yellow: '#fef9c3',
          yellowDark: '#facc15',
          cream: '#fffbeb',
          surface: '#ffffff',
          surfaceDark: '#1c1917',
          card: '#fff7ed',
          cardDark: '#292524'
        }
      },
      fontFamily: {
        sans: ['"Quicksand"', '"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(244, 63, 94, 0.08), 0 8px 10px -6px rgba(244, 63, 94, 0.04)',
        'soft-lg': '0 20px 35px -5px rgba(244, 63, 94, 0.12), 0 10px 15px -7px rgba(244, 63, 94, 0.06)',
        'soft-dark': '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
      },
      keyframes: {
        hop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-24px)' }
        },
        blink: {
          '0%, 90%, 100%': { opacity: '1' },
          '95%': { opacity: '0' }
        },
        popIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        hop: 'hop 0.45s ease-in-out',
        popIn: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    },
  },
  plugins: [],
}
