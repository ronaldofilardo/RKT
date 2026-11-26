import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

/**
 * Fade global de tema (claro ↔ escuro).
 *
 * Caracterização dos módulos CSS pós-split (d1806c9): garante que a
 * transição de tema de 0.3s (desde 6ff3f9d) continua cobrindo os containers,
 * que as interações mantêm timings rápidos e que prefers-reduced-motion
 * desliga tudo.
 */
describe('Theme fade transition (css modular)', () => {
  let css: string;
  let tokens: string;

  const read = (rel: string) =>
    fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

  beforeAll(() => {
    css = [
      'src/app/css/utilities/transitions.css',
      'src/app/css/utilities/motion.css',
      'src/app/css/base/reset.css',
    ].map(read).join('\n');
    tokens = read('src/app/css/tokens/airtable-tokens.css');
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

  describe('bloco de tema', () => {
    const selector = 'body, header, nav, main, footer, section, article';

    it('existe e cobre os containers principais', () => {
      expect(getBlock(selector)).not.toBeNull();
    });

    it('transiciona background-color e border-color em 0.3s ease', () => {
      const block = getBlock(selector) as string;
      expect(block).toMatch(/background-color\s+0\.3s\s+ease/);
      expect(block).toMatch(/border-color\s+0\.3s\s+ease/);
    });

    it('não usa "transition: all" nem o timing antigo de 2s', () => {
      const block = getBlock(selector) as string;
      expect(block).not.toMatch(/\ball\b/);
      expect(block).not.toMatch(/\b2s\b/);
    });
  });

  describe('body', () => {
    it('não mantém transition herdada de tema', () => {
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

    it('os overrides vêm depois do bloco de tema (cascata)', () => {
      const normalized = css.replace(/\s+/g, ' ');
      const themeIdx = normalized.indexOf('body, header');
      const overrideIdx = normalized.indexOf('button,');
      expect(themeIdx).toBeGreaterThan(-1);
      expect(overrideIdx).toBeGreaterThan(themeIdx);
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
    it('--motion-fast, --motion-base e --ease-standard estão em airtable-tokens.css', () => {
      expect(tokens).toMatch(/--motion-fast:/);
      expect(tokens).toMatch(/--motion-base:/);
      expect(tokens).toMatch(/--ease-standard:/);
    });
  });
});
