/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'codestorm-dark': '#0a1120',
        'codestorm-darker': '#050a14',
        'codestorm-blue': '#1e3a8a',
        'codestorm-gold': '#fbbf24',
        'codestorm-accent': '#3b82f6',
        'codestorm-gray': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};


