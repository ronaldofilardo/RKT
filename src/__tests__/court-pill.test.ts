import fs from 'node:fs';
import path from 'node:path';

/**
 * Caracterização da pill de superfície (TD-066 resíduo 3).
 *
 * `--court-badge-bg-opacity`/`--court-badge-text-opacity` existiam desde o
 * plano outdoor mas nenhum componente os consumia. Garante: (a) a classe
 * `.court-pill` os consome com os tokens de texto por tema, (b) os tokens
 * `--court-pill-*-text` estão definidos nos temas claro e escuro e (c) o
 * badge de tipo de piso usa a classe em vez das cores genéricas.
 */
const read = (rel: string) =>
  fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

const css = read('src/app/globals.css');
const formatLabel = read('src/components/dashboard/format-label.tsx');

function block(selector: string): string | null {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (norm(m[1]) === norm(selector)) return m[2];
  }
  return null;
}

describe('court-pill (pill de superfície)', () => {
  it('classe consome --court-badge-bg-opacity e --court-badge-text-opacity', () => {
    const body = block('.court-pill');
    expect(body).not.toBeNull();
    expect(body).toContain('var(--court-badge-bg-opacity)');
    expect(body).toContain('var(--court-badge-text-opacity)');
  });

  it('mapeia os 3 tipos de piso para os tokens do design system', () => {
    for (const court of ['clay', 'grass', 'hard']) {
      expect(block(`.court-pill[data-court='${court}']`)).toContain(`--telemetry-court-${court}`);
    }
  });

  it('tokens de texto definidos nos temas claro (escurecido) e escuro (brilho)', () => {
    for (const token of ['--court-pill-clay-text', '--court-pill-grass-text', '--court-pill-hard-text']) {
      const occurrences = css.split(token).length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(2); // :root/dark + light
    }
    // claro: escurecido OKLCH L=0.35 (>=4.5:1 no bg 12%)
    expect(css).toMatch(/--court-pill-clay-text:\s*#701100/i);
    // escuro: cor do piso com brilho sutil (>=4.5:1 no bg 20%)
    expect(css).toMatch(/--court-pill-clay-text:\s*#D08161/i);
  });

  it('FormatLabel usa a classe court-pill e abandonou as cores genéricas', () => {
    expect(formatLabel).toContain('court-pill');
    expect(formatLabel).toContain('data-court=');
    expect(formatLabel).not.toMatch(/bg-amber-500|bg-emerald-500|bg-sky-500/);
  });
});
