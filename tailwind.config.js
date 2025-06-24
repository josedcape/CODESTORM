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
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideInRight': 'slideInRight 0.3s ease-in-out',
        'slideInLeft': 'slideInLeft 0.3s ease-in-out',
        'slideInUp': 'slideInUp 0.3s ease-in-out',
        'slideInDown': 'slideInDown 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-fast': 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-light': 'bounce-light 1s infinite',
        'lightning': 'lightning 1.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'collapse': 'collapse 0.3s ease-out',
        'expand': 'expand 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        collapse: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        expand: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'auto', opacity: '1' },
        },
        'bounce-light': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        lightning: {
          '0%': {
            opacity: '0',
            filter: 'brightness(1)'
          },
          '5%, 20%': {
            opacity: '1',
            filter: 'brightness(2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))'
          },
          '25%, 100%': {
            opacity: '0',
            filter: 'brightness(1)'
          },
        },
        glow: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.5))'
          },
          '50%': {
            filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))'
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          },
        },
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)'
          },
          '10%, 30%, 50%, 70%, 90%': {
            transform: 'translateX(-2px)'
          },
          '20%, 40%, 60%, 80%': {
            transform: 'translateX(2px)'
          },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
};


