/**
 * Guard de wiring Tailwind x Componentes (TD-066).
 *
 * O plano outdoor entregou os tokens `--telemetry-score-*` (WCAG AAA 7:1) e os
 * componentes passaram a usar `text-telemetry-score-*`, mas a chave `score`
 * faltava em `tailwind.config.ts` — o Tailwind nunca gerou as regras e os
 * dígitos caíam na cor herdada. A suíte contrast-wcag.test.ts não pegou isso
 * porque valida as variáveis CSS, não as classes.
 *
 * Este teste compila o Tailwind de verdade com os arquivos consumidores e
 * falha se qualquer classe `*-telemetry-*` usada no código não existir no CSS.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import type { Config } from 'tailwindcss';
import config from '../../tailwind.config';

const CONSUMERS: string[] = [
  'src/components/scoring/scoreboard-card-cells.tsx',
  'src/components/scoring/ScoreboardCard.tsx',
  'src/components/dashboard/match-card-set-cells.tsx',
  'src/components/dashboard/match-card-score-grid.tsx',
  'src/components/dashboard/match-card-live-points.tsx',
];

/** Captura variantes (`dark:text-...`) e modificadores de opacidade (`/70`). */
const CLASS_PATTERN = /(?:[a-z0-9]+:)*text-telemetry-[a-z0-9-]+(?:\/[0-9]+)?/g;

function repoPath(file: string): string {
  return path.resolve(__dirname, '..', '..', file);
}

/**
 * Monta o regex que procura a regra da classe no CSS gerado pelo PostCSS.
 * Cobre variantes com pseudoclasse (`dark\:x:is([data-theme="dark"] *)`) e
 * modificadores escapados (`text-telemetry-text-muted\/70`).
 */
function matchesRule(css: string, cls: string): boolean {
  const cssSelector = `.${cls.replace(/([/.:])/g, '\\$1')}`;
  const escaped = cssSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}(?:\\s*:[a-z-]+\\([^)]*\\))*\\s*\\{`).test(css);
}

function usedTelemetryClasses(): string[] {
  const found = new Set<string>();
  for (const file of CONSUMERS) {
    const source = readFileSync(repoPath(file), 'utf8');
    for (const match of source.match(CLASS_PATTERN) ?? []) found.add(match);
  }
  return [...found].sort();
}

async function buildUtilities(content: string[]): Promise<string> {
  const cfg: Config = { ...config, content };
  const result = await postcss([tailwindcss(cfg)]).process('@tailwind utilities;', { from: undefined });
  return result.css;
}

describe('guard: classes text-telemetry-* usadas nos componentes geram CSS', () => {
  it('encontra as classes nos arquivos consumidores', () => {
    const classes = usedTelemetryClasses();
    expect(classes.length).toBeGreaterThan(0);
    expect(classes).toContain('text-telemetry-score-main');
  });

  it('emite uma regra CSS para cada classe usada', async () => {
    const css = await buildUtilities(CONSUMERS);
    const missing = usedTelemetryClasses().filter((cls) => !matchesRule(css, cls));
    expect(missing).toEqual([]);
  });

  it('aponta a regra dos dígitos para o token AAA (--telemetry-score-*)', async () => {
    const css = await buildUtilities(CONSUMERS);
    expect(css).toMatch(/\.text-telemetry-score-main\s*\{[^}]*--telemetry-score-main/);
    expect(css).toMatch(/\.text-telemetry-score-secondary\s*\{[^}]*--telemetry-score-secondary/);
    expect(css).toMatch(/\.text-telemetry-score-accent\s*\{[^}]*--telemetry-score-accent/);
  });
});
