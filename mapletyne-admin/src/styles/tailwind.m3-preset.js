/**
 * Tailwind CSS Preset for Material 3 Design System
 * Drop-in preset for Tremor, Horizon UI, Next.js, and Vite
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        md: {
          primary: 'var(--md-sys-color-primary)',
          'on-primary': 'var(--md-sys-color-on-primary)',
          'primary-container': 'var(--md-sys-color-primary-container)',
          'on-primary-container': 'var(--md-sys-color-on-primary-container)',
          secondary: 'var(--md-sys-color-secondary)',
          'on-secondary': 'var(--md-sys-color-on-secondary)',
          'secondary-container': 'var(--md-sys-color-secondary-container)',
          'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
          tertiary: 'var(--md-sys-color-tertiary)',
          'on-tertiary': 'var(--md-sys-color-on-tertiary)',
          'tertiary-container': 'var(--md-sys-color-tertiary-container)',
          'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
          error: 'var(--md-sys-color-error)',
          'on-error': 'var(--md-sys-color-on-error)',
          'error-container': 'var(--md-sys-color-error-container)',
          'on-error-container': 'var(--md-sys-color-on-error-container)',
          background: 'var(--md-sys-color-background)',
          'on-background': 'var(--md-sys-color-on-background)',
          surface: 'var(--md-sys-color-surface)',
          'on-surface': 'var(--md-sys-color-on-surface)',
          'surface-variant': 'var(--md-sys-color-surface-variant)',
          'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
          'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
          'surface-container-low': 'var(--md-sys-color-surface-container-low)',
          'surface-container': 'var(--md-sys-color-surface-container)',
          'surface-container-high': 'var(--md-sys-color-surface-container-high)',
          'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
          outline: 'var(--md-sys-color-outline)',
          'outline-variant': 'var(--md-sys-color-outline-variant)',
          shadow: 'var(--md-sys-color-shadow)',
          scrim: 'var(--md-sys-color-scrim)',
          'inverse-surface': 'var(--md-sys-color-inverse-surface)',
          'inverse-on-surface': 'var(--md-sys-color-inverse-on-surface)',
          'inverse-primary': 'var(--md-sys-color-inverse-primary)',
        },
      },
      borderRadius: {
        'md-xs': 'var(--md-sys-shape-corner-xs)',
        'md-sm': 'var(--md-sys-shape-corner-sm)',
        'md-md': 'var(--md-sys-shape-corner-md)',
        'md-lg': 'var(--md-sys-shape-corner-lg)',
        'md-xl': 'var(--md-sys-shape-corner-xl)',
        'md-full': 'var(--md-sys-shape-corner-full)',
      },
      boxShadow: {
        'md-1': 'var(--md-sys-elevation-level-1)',
        'md-2': 'var(--md-sys-elevation-level-2)',
        'md-3': 'var(--md-sys-elevation-level-3)',
        'md-4': 'var(--md-sys-elevation-level-4)',
        'md-5': 'var(--md-sys-elevation-level-5)',
      },
    },
  },
};
