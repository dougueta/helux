import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'helux-dark':        '#0A0C0A',
        'helux-surface':     '#161916',
        'helux-surface-2':   '#1E221D',
        'helux-surface-3':   '#272C25',
        'helux-accent':      '#C8FA4B',
        'helux-accent-ink':  '#0C1003',
        'helux-warn':        '#F5B73E',
        'helux-danger':      '#FF6F5E',
        'helux-text':        '#F0F3EA',
        'helux-dim':         '#A4AB9C',
        'helux-faint':       '#6A7164',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
