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
        obsidian: {
          950: '#06080F',
          900: '#0B0F19',
          850: '#0E1424',
          800: '#141C30',
          750: '#19233C',
          700: '#202D4C',
          600: '#2C3E68',
        },
        aurora: {
          300: '#5EFCBD',
          400: '#00F5A0',
          500: '#00D588',
          600: '#00AB6B',
          950: '#022115',
        },
        coral: {
          300: '#FFA0A0',
          400: '#FF6B6B',
          500: '#FF4757',
          600: '#E82A3A',
          950: '#2B080C',
        },
        iris: {
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          950: '#1E1035',
        },
        solar: {
          300: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          950: '#2B1A04',
        },
        electric: {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 16px 40px -8px rgba(0, 0, 0, 0.5), 0 4px 8px -2px rgba(0, 0, 0, 0.3)',
        'glow-aurora': '0 4px 14px -2px rgba(16, 185, 129, 0.3)',
        'glow-coral': '0 4px 14px -2px rgba(244, 63, 94, 0.25)',
        'glow-iris': '0 4px 14px -2px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 4px 14px -2px rgba(14, 165, 233, 0.25)',
        'glow-indigo': '0 0 20px -4px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.3)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}
