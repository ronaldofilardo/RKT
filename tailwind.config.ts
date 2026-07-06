import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        /* Airtable Design System Colors */
        airtable: {
          fg: '#181d26',
          'fg-2': '#333333',
          muted: 'rgba(4, 14, 32, 0.69)',
          border: '#e0e2e6',
          'border-soft': '#eef0f3',
          accent: '#1b61c9',
          'accent-hover': '#254fad',
          'accent-active': '#143d8d',
          success: '#006400',
          warn: '#eab308',
          danger: '#dc2626',
        },
        /* Legacy colors - mapped to Airtable tokens */
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        /* Airtable Design System Typography */
        display: ['Haas Groot Disp', 'Haas', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['Haas', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        /* Airtable Design System Typography Scale */
        'airtable-xs': ['12px', { lineHeight: '1.35', letterSpacing: '0.28px' }],
        'airtable-sm': ['14px', { lineHeight: '1.35', letterSpacing: '0.28px' }],
        'airtable-base': ['16px', { lineHeight: '1.35', letterSpacing: '0.18px' }],
        'airtable-lg': ['20px', { lineHeight: '1.35', letterSpacing: '0.1px' }],
        'airtable-xl': ['24px', { lineHeight: '1.25', letterSpacing: '0.12px' }],
        'airtable-2xl': ['32px', { lineHeight: '1.25' }],
        'airtable-3xl': ['40px', { lineHeight: '1.25' }],
        'airtable-4xl': ['48px', { lineHeight: '1.15' }],
      },
      spacing: {
        /* Airtable Design System Spacing Scale (4px base) */
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-12': '48px',
        'section-y-desktop': '96px',
        'section-y-tablet': '64px',
        'section-y-phone': '48px',
      },
      borderRadius: {
        /* Airtable Design System Radius Scale */
        'radius-sm': '12px',
        'radius-md': '16px',
        'radius-lg': '24px',
        'radius-pill': '9999px',
      },
      boxShadow: {
        /* Airtable Design System Elevation */
        'elev-flat': 'none',
        'elev-ring': '0 0 0 1px #e0e2e6',
        'elev-raised': '0 0 1px rgba(0, 0, 0, 0.32), 0 2px 4px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'focus-ring': '0 0 0 3px rgba(27, 97, 201, 0.3)',
      },
      transitionDuration: {
        /* Airtable Design System Motion */
        'motion-fast': '150ms',
        'motion-base': '200ms',
      },
      transitionTimingFunction: {
        'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      maxWidth: {
        'container': '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
