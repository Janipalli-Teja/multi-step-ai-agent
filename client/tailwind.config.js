/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: '#050810',
        bgSurface: '#0d1117',
        bgCard: '#111827',
        borderLight: 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'glow-drift': 'glow-drift 8s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        'fast-pulse-dot': 'pulse-dot 1s infinite',
        'step-glow': 'step-glow 2s ease-in-out infinite alternate',
        'arrow-pulse': 'arrow-pulse 1s ease-in-out infinite alternate',
        'loop-beat': 'loop-beat 0.8s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'badge-pulse': 'badge-pulse 1.5s ease-in-out infinite'
      },
      keyframes: {
        'glow-drift': {
          'from': { transform: 'translate(0,0)' },
          'to': { transform: 'translate(-30px, -30px)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        },
        'step-glow': {
          'from': { boxShadow: '0 0 0 rgba(59,130,246,0)' },
          'to': { boxShadow: '0 0 12px rgba(59,130,246,0.2)' }
        },
        'arrow-pulse': {
          'from': { opacity: '0.5' },
          'to': { opacity: '1' }
        },
        'loop-beat': {
          'from': { transform: 'scale(1)' },
          'to': { transform: 'scale(1.1)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'badge-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      }
    },
  },
  plugins: [],
}
