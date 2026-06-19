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
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}

export default config
