/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Surface tokens
        surface: 'hsl(var(--surface))',
        'surface-dim': 'hsl(var(--surface-dim))',
        'surface-container-lowest': 'hsl(var(--surface-container-lowest, var(--surface-dim)))',
        'surface-container-low': 'hsl(var(--surface-container-low))',
        'surface-container': 'hsl(var(--surface-container))',
        'surface-container-high': 'hsl(var(--surface-container-high))',
        'surface-container-highest': 'hsl(var(--surface-container-highest))',
        'on-surface': 'hsl(var(--on-surface))',
        'on-surface-variant': 'hsl(var(--on-surface-variant))',
        outline: 'hsl(var(--outline))',
        'outline-variant': 'hsl(var(--outline-variant))',
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
        },
        'primary-container': 'hsl(var(--primary-container))',
        'secondary-container': 'hsl(var(--secondary-container))',
        'tertiary-container': 'hsl(var(--tertiary-container))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        serif: ['Noto Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
