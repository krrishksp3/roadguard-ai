/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0f1d',
          900: '#0f172a',
          850: '#131d31',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        warm: {
          50: '#fafaf9',
          100: '#f7f7f5',
          200: '#eae8e4',
          300: '#d6d3cd',
        },
        gov: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          500: '#0f766e',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
          navy: '#0f172a',
          deep: '#0a0f1d',
        },
        civic: {
          teal: '#0f766e',
          emerald: '#10b981',
          cyan: '#06b6d4',
          accent: '#14b8a6',
          slate: '#0f172a',
          ink: '#111827',
          warm: '#f7f7f5',
          amber: '#f59e0b',
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#10b981',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'premium': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'float': '0 10px 30px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
