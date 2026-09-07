/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          navy: '#0b192c',
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
