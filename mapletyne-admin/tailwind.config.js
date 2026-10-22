/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'on-background': 'var(--on-background)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          foreground: 'var(--on-primary)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          foreground: 'var(--on-secondary)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          foreground: 'var(--on-tertiary)',
        },
        'status-online': 'var(--status-online)',
        'status-fault': 'var(--status-fault)',
        'status-in-use': 'var(--status-in-use)',
        'status-offline': 'var(--status-offline)',
        'electric-blue': 'var(--electric-blue)',
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        micro: ['0.75rem', { lineHeight: '1rem' }],       // 12px Enterprise minimum floor (ADR-003)
        xs: ['0.75rem', { lineHeight: '1rem' }],          // 12px (Paragraphs, meta, th headers)
        sm: ['0.875rem', { lineHeight: '1.25rem' }],      // 14px (Base body, table data cells, nav links)
        base: ['1rem', { lineHeight: '1.5rem' }],         // 16px (Buttons, form inputs, interactive controls)
        lg: ['1.125rem', { lineHeight: '1.625rem' }],     // 18px (Brand logo text, sub-headings)
        xl: ['1.25rem', { lineHeight: '1.75rem' }],       // 20px (Section titles, card headers)
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px (Mid-level display)
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px (Sub-hero display)
        '4xl': ['2.1875rem', { lineHeight: '2.625rem' }], // 35px (Primary page headers: h1, h2.reveal)
        '5xl': ['3rem', { lineHeight: '1.1' }],           // 48px (Home brand, hero, major metrics)
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};
