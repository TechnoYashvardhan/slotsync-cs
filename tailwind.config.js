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
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        'glow-aurora': '0 4px 14px -2px rgba(16, 185, 129, 0.3)',
        'glow-coral': '0 4px 14px -2px rgba(244, 63, 94, 0.25)',
        'glow-iris': '0 4px 14px -2px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 4px 14px -2px rgba(14, 165, 233, 0.25)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
      }
    },
  },
  plugins: [],
}
