/**
 * @jest-environment jsdom
 *
 * Characterization tests — Dual Theme (Light & Dark)
 *
 * Objetivo: capturar e assegurar o comportamento do design system de telemetria
 * quando o tema do dispositivo e claro (prefers-color-scheme: light) e quando e escuro
 * (prefers-color-scheme: dark).
 *
 * NUNCA altere estes testes sem revisar a especificacao do design system.
 */
import fs from 'fs';
import path from 'path';

describe('Dual Theme Design System (Light & Dark)', () => {
  const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
  const tailwindConfigPath = path.resolve(process.cwd(), 'tailwind.config.ts');
  const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

  let globalsCss: string;
  let tailwindConfig: string;
  let layoutTsx: string;

  beforeAll(() => {
    globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');
    tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf-8');
    layoutTsx = fs.readFileSync(layoutPath, 'utf-8');
  });

  describe('Tailwind Configuration', () => {
    it('configura tokens de telemetria baseados em variaveis CSS dinamicas com suporte a alfa', () => {
      expect(tailwindConfig).toContain("base: 'rgb(var(--telemetry-base) / <alpha-value>)'");
      expect(tailwindConfig).toContain("card: 'rgb(var(--telemetry-card) / <alpha-value>)'");
      expect(tailwindConfig).toContain("elevated: 'rgb(var(--telemetry-elevated) / <alpha-value>)'");
      expect(tailwindConfig).toContain("volt: 'rgb(var(--telemetry-volt) / <alpha-value>)'");
      expect(tailwindConfig).toContain("primary: 'rgb(var(--telemetry-text-primary) / <alpha-value>)'");
      expect(tailwindConfig).toContain("muted: 'rgb(var(--telemetry-text-muted) / <alpha-value>)'");
    });
  });

  describe('Root Layout Configuration', () => {
    it('suporta colorScheme light dark nos metadados de viewport', () => {
      expect(layoutTsx).toContain("colorScheme: 'light dark'");
    });

    it('define themeColor responsivo para prefers-color-scheme light e dark', () => {
      expect(layoutTsx).toContain("(prefers-color-scheme: dark)");
      expect(layoutTsx).toContain("(prefers-color-scheme: light)");
    });

    it('nao trava classe dark estatica na tag html', () => {
      expect(layoutTsx).not.toMatch(/className=\{`dark\s/);
    });
  });

  describe('globals.css Dual Theme Tokens', () => {
    it('define tokens padrao para telemetria broadcast escura em :root', () => {
      expect(globalsCss).toMatch(/--telemetry-base:\s*10\s+15\s+29/);
      expect(globalsCss).toMatch(/--telemetry-card:\s*17\s+24\s+39/);
      expect(globalsCss).toMatch(/--telemetry-text-primary:\s*248\s+250\s+252/);
      expect(globalsCss).toMatch(/--telemetry-volt:\s*204\s+255\s+0/);
    });

    it('define tokens para tema claro sob @media (prefers-color-scheme: light)', () => {
      expect(globalsCss).toContain('@media (prefers-color-scheme: light)');
      expect(globalsCss).toMatch(/--telemetry-base:\s*241\s+245\s+249/);
      expect(globalsCss).toMatch(/--telemetry-card:\s*255\s+255\s+255/);
      expect(globalsCss).toMatch(/--telemetry-text-primary:\s*15\s+23\s+42/);
      expect(globalsCss).toMatch(/--telemetry-text-muted:\s*100\s+116\s+139/);
      expect(globalsCss).toMatch(/--telemetry-volt:\s*101\s+163\s+13/);
    });

    it('suporta forçamento explícito via classe .dark e .light', () => {
      expect(globalsCss).toContain('.dark');
      expect(globalsCss).toContain('.light');
    });

    it('adapta bordas e translucidezes (border-white/*, bg-white/*) quando em tema claro preservando em .dark', () => {
      expect(globalsCss).toContain('@media (prefers-color-scheme: light)');
      expect(globalsCss).toContain('.border-white\\/10');
      expect(globalsCss).toContain('.dark .border-white\\/10');
      expect(globalsCss).toContain('.bg-white\\/5');
      expect(globalsCss).toContain('.hover\\:bg-white\\/5');
    });
  });

  describe('Scoring Dual Theme Support', () => {
    it('suporta modo claro na pagina de scoring sem travar classe dark estatica', () => {
      const scoringPage = fs.readFileSync(path.resolve(process.cwd(), 'src/app/match/[id]/scoring/page.tsx'), 'utf-8');
      expect(scoringPage).toContain('className="fixed inset-0 overflow-hidden bg-telemetry-base flex flex-col"');
      expect(scoringPage).not.toContain('className="dark min-h-screen');
    });

    it('inclui o botao unico de tema (ThemeToggleButton) no rodape ActionFooter para alternar tema diretamente no scoring', () => {
      const sections = fs.readFileSync(path.resolve(process.cwd(), 'src/components/scoring/ActionBar.sections.tsx'), 'utf-8');
      expect(sections).toContain('<ThemeToggleButton />');
      const matchHeader = fs.readFileSync(path.resolve(process.cwd(), 'src/components/scoring/MatchHeader.tsx'), 'utf-8');
      expect(matchHeader).not.toContain('<ThemeToggle');
    });
  });
});
