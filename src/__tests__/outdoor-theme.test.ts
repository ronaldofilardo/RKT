import fs from 'node:fs';
import path from 'node:path';

/**
 * Caracterização estática do modo outdoor (TD-066 resíduo 2).
 *
 * O plano outdoor prometia um modo "sol forte"; até 2026-11-14 só existiam
 * light/dark. Garante: (a) tokens de alto contraste no globals.css,
 * (b) ThemePreference aceitando 'outdoor', (c) persistência/restauração
 * da preferência (provider + script inline do layout) e (d) botão no toggle.
 */
const read = (rel: string) =>
  fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

const css = read('src/app/globals.css');
const provider = read('src/contexts/use-theme-provider-state.ts');
const layout = read('src/app/layout.tsx');
const toggle = read('src/components/theme-toggle-options.tsx');

function block(selector: string): string | null {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (norm(m[1]) === norm(selector)) return m[2];
  }
  return null;
}

describe('modo outdoor (alto contraste)', () => {
  const selector = ":root[data-theme='outdoor']:not(.dark)";

  it('tem bloco de tokens no globals.css', () => {
    const body = block(selector);
    expect(body).not.toBeNull();
    expect(body).toMatch(/--telemetry-base:\s*255 255 255/);
    expect(body).toMatch(/--telemetry-text-primary:\s*0 0 0/);
    expect(body).toMatch(/--telemetry-score-main:\s*0 0 0/);
    expect(body).toMatch(/--body-bg:\s*#FFFFFF/);
  });

  it('ThemePreference inclui outdoor', () => {
    expect(provider).toMatch(/ThemePreference = 'light' \| 'dark' \| 'system' \| 'outdoor'/);
  });

  it('provider aplica data-theme=outdoor (resolvedTheme=light)', () => {
    expect(provider).toContain("theme === 'outdoor' ? 'outdoor' : 'light'");
    expect(provider).toContain("const effectiveTheme: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'");
  });

  it('persiste e restaura a preferência outdoor', () => {
    expect(provider).toContain("saved === 'light' || saved === 'dark' || saved === 'outdoor'");
    // script inline do <head> restaura sem flash
    expect(layout).toContain("p === 'outdoor'");
    expect(layout).toContain("setAttribute('data-theme', 'outdoor')");
  });

  it('ThemeToggle expõe o botão outdoor', () => {
    expect(toggle).toContain("id: 'outdoor'");
    expect(toggle).toContain('Modo Outdoor (alto contraste)');
  });
});
