import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

/**
 * Fade global de tema (claro ↔ escuro).
 *
 * Caracterização estática do globals.css: garante que a transição de 2s
 * continua global (cobre componentes futuros), que as interações mantêm
 * timings rápidos e que prefers-reduced-motion desliga tudo.
 */
describe('Theme fade transition (globals.css)', () => {
  let css: string;

  beforeAll(() => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf-8');
    // remove comentários para não gerar falsos positivos
    css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  });

  /** Retorna o corpo do primeiro bloco cujo seletor (normalizado) é igual ao informado. */
  function getBlock(selector: string): string | null {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(css)) !== null) {
      if (norm(m[1]) === norm(selector)) return m[2];
    }
    return null;
  }

  describe('bloco global', () => {
    const selector = '*, *::before, *::after';

    it('existe e cobre *, ::before e ::after', () => {
      expect(getBlock(selector)).not.toBeNull();
    });

    it.each([
      'background-color',
      'color',
      'border-color',
      'fill',
      'stroke',
      'box-shadow',
    ])('transiciona %s em 2s ease', (prop) => {
      const block = getBlock(selector) as string;
      expect(block).toMatch(new RegExp(`${prop}\\s+2s\\s+ease`));
    });

    it('não usa "transition: all" (evitaria animar layout/transform)', () => {
      expect(getBlock(selector)).not.toMatch(/\ball\b/);
    });
  });

  describe('body', () => {
    it('não mantém a transition antiga de 0.2s', () => {
      const body = getBlock('body') as string;
      expect(body).not.toBeNull();
      expect(body).not.toMatch(/transition/);
    });
  });

  describe('overrides de interação', () => {
    it('button, a, .btn-primary e .btn-white usam timing rápido', () => {
      const block = getBlock('button, a, .btn-primary, .btn-white');
      expect(block).not.toBeNull();
      expect(block).toMatch(/var\(--motion-fast\)\s+var\(--ease-standard\)/);
      expect(block).not.toMatch(/\b2s\b/);
    });

    it('.transition-base usa --motion-base', () => {
      expect(getBlock('.transition-base')).toMatch(/all\s+var\(--motion-base\)\s+var\(--ease-standard\)/);
    });

    it('.transition-fast usa --motion-fast', () => {
      expect(getBlock('.transition-fast')).toMatch(/all\s+var\(--motion-fast\)\s+var\(--ease-standard\)/);
    });

    it('os overrides vêm depois do bloco global (cascata)', () => {
      const globalIdx = css.indexOf('*::after {');
      const overrideIdx = css.indexOf('button,');
      expect(globalIdx).toBeGreaterThan(-1);
      expect(overrideIdx).toBeGreaterThan(globalIdx);
    });
  });

  describe('prefers-reduced-motion', () => {
    it('zera animation e transition', () => {
      const m = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\})\s*\}/);
      expect(m).not.toBeNull();
      const body = m![1];
      expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
      expect(body).toMatch(/animation-iteration-count:\s*1\s*!important/);
      expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
      expect(body).toMatch(/scroll-behavior:\s*auto\s*!important/);
    });
  });

  describe('variáveis de motion referenciadas existem', () => {
    it('--motion-fast, --motion-base e --ease-standard estão em design-system.css', () => {
      const ds = fs.readFileSync(path.resolve(process.cwd(), 'src/app/design-system.css'), 'utf-8');
      expect(ds).toMatch(/--motion-fast:/);
      expect(ds).toMatch(/--motion-base:/);
      expect(ds).toMatch(/--ease-standard:/);
    });
  });
});
