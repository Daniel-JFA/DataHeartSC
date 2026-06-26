/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // ─── Brand color scale ───────────────────────────────────────────────
      // Primary: #be123c — deep crimson rose
      // Generated as a perceptually-uniform ramp from near-white to near-black,
      // centered on #be123c at the 600 stop (main action color).
      colors: {
        brand: {
          50:  '#fff1f3',   // almost white, faint blush — hover backgrounds
          100: '#ffe4e8',   // very light rose — badge backgrounds
          200: '#fecdd5',   // light rose — tinted borders
          300: '#fda4b3',   // mid-light rose — disabled states, illustrations
          400: '#fb6e88',   // medium rose — secondary accents
          500: '#f43f65',   // bright rose — hover on buttons
          600: '#e11d48',   // vivid crimson — primary CTA hover
          700: '#be123c',   // PRIMARY — deep crimson rose (#be123c)
          800: '#9f1239',   // dark crimson — pressed states
          900: '#881337',   // very dark — focus rings on light bg
          950: '#4c0519',   // near-black crimson — text on light brand bg
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: [
          'Inter',
          'Inter var',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },

      // ─── Font sizes (Inter-optimised) ────────────────────────────────────
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px — labels, captions
        xs:    ['0.75rem',  { lineHeight: '1rem' }],       // 12px
        sm:    ['0.8125rem',{ lineHeight: '1.25rem' }],    // 13px — table cells, sidebar
        base:  ['0.875rem', { lineHeight: '1.5rem' }],     // 14px — body default
        md:    ['1rem',     { lineHeight: '1.5rem' }],     // 16px
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],    // 20px
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],       // 24px — page titles
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
      },

      // ─── Border radius ───────────────────────────────────────────────────
      borderRadius: {
        xs:   '0.1875rem',  // 3px  — tight chips
        sm:   '0.25rem',    // 4px  — inputs, table cells
        DEFAULT: '0.375rem',// 6px  — default
        md:   '0.5rem',     // 8px  — cards, dropdowns
        lg:   '0.75rem',    // 12px — modal dialogs
        xl:   '1rem',       // 16px — large cards
        '2xl':'1.5rem',     // 24px — login card
      },

      // ─── Box shadows ─────────────────────────────────────────────────────
      boxShadow: {
        // Clean, Stripe-style layered shadows — no colored glow
        xs:   '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm:   '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        DEFAULT:'0 2px 6px -1px rgb(0 0 0 / 0.08), 0 1px 4px -2px rgb(0 0 0 / 0.08)',
        md:   '0 4px 12px -2px rgb(0 0 0 / 0.10), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        lg:   '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 10px -3px rgb(0 0 0 / 0.08)',
        xl:   '0 16px 40px -8px rgb(0 0 0 / 0.14), 0 8px 16px -6px rgb(0 0 0 / 0.08)',
        // Focus ring for brand elements
        'brand-focus': '0 0 0 3px rgb(190 18 60 / 0.20)',
        // Inner shadow for pressed inputs
        inner: 'inset 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        none:  'none',
      },

      // ─── Transitions ─────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '100ms',
        normal:  '200ms',
        slow:    '300ms',
      },

      // ─── Z-index scale ───────────────────────────────────────────────────
      zIndex: {
        sidebar:  '40',
        header:   '50',
        dropdown: '60',
        modal:    '70',
        toast:    '80',
        tooltip:  '90',
      },

      // ─── Spacing extras ──────────────────────────────────────────────────
      spacing: {
        4.5: '1.125rem',   // 18px — handy for icon buttons
        13:  '3.25rem',    // 52px — sidebar icon column width
        18:  '4.5rem',     // 72px — common form element height variants
        sidebar: '15rem',  // 240px — sidebar width (replaces w-64)
      },

      // ─── Animation ───────────────────────────────────────────────────────
      keyframes: {
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'skeleton': 'skeleton-shimmer 2s linear infinite',
        'fade-in':  'fade-in 0.2s ease-out both',
        'slide-in': 'slide-in-left 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
