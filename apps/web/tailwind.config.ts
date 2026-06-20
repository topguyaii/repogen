import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#050507',
          elev: '#0c0c12',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        text: {
          DEFAULT: '#EDEDF2',
          dim: '#9A9AA8',
        },
        aurora: {
          blue: '#2536FF',
          violet: '#6A3CFF',
          magenta: '#C44BD6',
          cyan: '#4FD1E0',
          green: '#8FCF9A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

export default config
