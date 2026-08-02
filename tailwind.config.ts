import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    /**
     * DESIGN TOKENS — rkt Design System
     * 
     * Baseado em Airtable Design System + adaptações para tênis
     * Documentação: /docs/design-system.md
     * 
     * Owner: @frontend
     * Status: Oficial (Onda 1 — Guardrails)
     */
    extend: {
      /**
       * CORE COLORS
       * Uso: bg-accent, text-fg, border-soft, etc.
       */
      colors: {
        /**
         * Cores de Texto (Foreground)
         * fg → texto principal
         * fg-2 → texto secundário
         * muted → texto terciário/desabilitado
         */
        fg: {
          DEFAULT: '#181d26',      // Texto principal
          2: '#333333',            // Texto secundário
          muted: 'rgba(4, 14, 32, 0.69)', // Texto terciário
        },
        /**
         * Cores de Fundo (Background)
         * bg → fundo principal
         * bg-2 → fundo secundário (cards, surfaces)
         * bg-3 → fundo terciário (inputs, etc.)
         */
        bg: {
          DEFAULT: '#ffffff',
          2: '#f8f9fa',
          3: '#f0f2f5',
        },
        /**
         * Cores de Borda
         * border → borda padrão
         * border-soft → borda suave
         */
        border: {
          DEFAULT: '#e0e2e6',
          soft: '#eef0f3',
        },
        /**
         * Cores de Ação (Accent)
         * accent → primária
         * accent-hover → hover
         * accent-active → active/pressed
         */
        accent: {
          DEFAULT: '#1b61c9',      // Azul primário
          hover: '#254fad',
          active: '#143d8d',
          light: '#e8f0fe',        // Fundo suave
        },
        /**
         * Cores de Estado (Status)
         * success → sucesso, confirmado
         * warn → atenção, pendente
         * danger → erro, perigo
         */
        success: {
          DEFAULT: '#006400',
          light: '#d4edda',
        },
        warn: {
          DEFAULT: '#eab308',
          light: '#fef3c7',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
        },
        /**
         * Cores Específicas de Tênis
         * court → cor de quadra
         * ball → cor de bola
         * net → cor de rede
         */
        tennis: {
          court: {
            hard: '#4a90d9',       // Quadra dura (azul)
            clay: '#c05621',       // Saibro (laranja)
            grass: '#48bb78',      // Grama (verde)
          },
          ball: '#ccff00',         // Bola de tênis (amarelo)
          net: '#1a202c',          // Rede (preto)
        },
        /**
         * Cores Legacy (retidas para compatibilidade)
         * Migrar gradualmente para tokens acima
         */
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
      /**
       * TYPOGRAPHY
       * Uso: font-display, font-body, text-airtable-base, etc.
       */
      fontFamily: {
        display: ['Haas Groot Disp', 'Haas', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['Haas', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        /**
         * Escala Tipográfica (mobile-first)
         * Uso: text-airtable-base, text-airtable-lg, etc.
         */
        'airtable-xs': ['12px', { lineHeight: '1.35', letterSpacing: '0.28px' }],
        'airtable-sm': ['14px', { lineHeight: '1.35', letterSpacing: '0.28px' }],
        'airtable-base': ['16px', { lineHeight: '1.35', letterSpacing: '0.18px' }],
        'airtable-lg': ['20px', { lineHeight: '1.35', letterSpacing: '0.1px' }],
        'airtable-xl': ['24px', { lineHeight: '1.25', letterSpacing: '0.12px' }],
        'airtable-2xl': ['32px', { lineHeight: '1.25' }],
        'airtable-3xl': ['40px', { lineHeight: '1.25' }],
        'airtable-4xl': ['48px', { lineHeight: '1.15' }],
      },
      /**
       * SPACING
       * Uso: space-4, section-y-desktop, etc.
       * Base: 4px (1rem = 16px)
       */
      spacing: {
        'space-1': '4px',   // 0.25rem
        'space-2': '8px',   // 0.5rem
        'space-3': '12px',  // 0.75rem
        'space-4': '16px',  // 1rem
        'space-5': '20px',  // 1.25rem
        'space-6': '24px',  // 1.5rem
        'space-8': '32px',  // 2rem
        'space-12': '48px', // 3rem
        'section-y-desktop': '96px',  // Espaçamento vertical de seção (desktop)
        'section-y-tablet': '64px',   // Espaçamento vertical de seção (tablet)
        'section-y-phone': '48px',    // Espaçamento vertical de seção (mobile)
      },
      /**
       * BORDER RADIUS
       * Uso: radius-sm, radius-md, radius-pill
       */
      borderRadius: {
        'radius-sm': '12px',
        'radius-md': '16px',
        'radius-lg': '24px',
        'radius-pill': '9999px',
      },
      /**
       * BOX SHADOW (Elevation)
       * Uso: elev-flat, elev-ring, elev-raised, focus-ring
       */
      boxShadow: {
        'elev-flat': 'none',
        'elev-ring': '0 0 0 1px #e0e2e6',
        'elev-raised': '0 0 1px rgba(0, 0, 0, 0.32), 0 2px 4px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'focus-ring': '0 0 0 3px rgba(27, 97, 201, 0.3)',
      },
      /**
       * TRANSITIONS (Motion)
       * Uso: duration-motion-fast, ease-standard
       */
      transitionDuration: {
        'motion-fast': '150ms',
        'motion-base': '200ms',
      },
      transitionTimingFunction: {
        'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      /**
       * CONTAINER
       * Uso: max-w-container
       */
      maxWidth: {
        'container': '1200px',
      },
      /**
       * BREAKPOINTS (Responsive)
       * Uso: sm:, md:, lg:, xl:, 2xl:
       */
      screens: {
        'sm': '640px',   // Mobile landscape
        'md': '768px',   // Tablet
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Desktop wide
        '2xl': '1536px', // Desktop extra wide
      },
    },
  },
  /**
   * PLUGINS
   * Adicionar plugins do Tailwind aqui
   */
  plugins: [],
};

export default config;
