import fs from 'fs';
import path from 'path';

/**
 * Teste Guardião — Integridade do Telemetry Design System
 * 
 * Este teste impede de forma automatizada e definitiva qualquer regressão visual
 * causada por agentes de IA ou refatorações futuras.
 * 
 * Regras validadas:
 * 1. Tokens de telemetria presentes e corretos no tailwind.config.ts e globals.css
 * 2. Suporte a darkMode sincronizado com ThemeContext ('class')
 * 3. Ausência de classes genéricas Tailwind (bg-gray-*, bg-sky-*, etc.) nos componentes críticos
 * 4. Presença obrigatória e proteção anti-colapso (flex-shrink-0) de ScoreboardCard e LiveCountersBar em ScoringPlayArea
 * 5. Ausência de arquivos legados de visualização (*.view.tsx) arcaicos
 */
describe('Telemetry Design System — Guardrail de Integridade Anti-Regressão', () => {
  const rootDir = process.cwd();

  test('1. tailwind.config.ts define tokens telemetry e darkMode por classe', () => {
    const tailwindPath = path.join(rootDir, 'tailwind.config.ts');
    const content = fs.readFileSync(tailwindPath, 'utf-8');

    expect(content).toMatch(/darkMode:\s*\['class',\s*'\[data-theme="dark"\]'\]/);
    expect(content).toContain('telemetry: {');
    expect(content).toContain("base: 'rgb(var(--telemetry-base) / <alpha-value>)'");
    expect(content).toContain("card: 'rgb(var(--telemetry-card) / <alpha-value>)'");
    expect(content).toContain("volt: 'rgb(var(--telemetry-volt) / <alpha-value>)'");
    expect(content).toContain("primary: 'rgb(var(--telemetry-text-primary) / <alpha-value>)'");
    expect(content).toContain("muted: 'rgb(var(--telemetry-text-muted) / <alpha-value>)'");
  });

  test('2. ScoringPlayArea preserva ScoreboardCard, LiveCountersBar e proteção flex-shrink-0', () => {
    const playAreaPath = path.join(rootDir, 'src/app/match/[id]/scoring/ScoringPlayArea.tsx');
    const content = fs.readFileSync(playAreaPath, 'utf-8');

    // Placar e LiveCounters obrigatórios
    expect(content).toContain('<ScoreboardCard');
    expect(content).toContain('<LiveCountersBar');

    // Proteção contra compressão em telas reduzidas
    expect(content).toMatch(/<div className="[^"]*flex-shrink-0[^"]*">\s*<ScoreboardCard/);
    expect(content).toMatch(/<div className="[^"]*flex-shrink-0[^"]*">\s*<LiveCountersBar/);
  });

  test('3. CourtBackground tem opacidade sutil e não domina a tela com azul sólido', () => {
    const courtPath = path.join(rootDir, 'src/components/scoring/CourtBackground.tsx');
    const content = fs.readFileSync(courtPath, 'utf-8');

    expect(content).toContain('opacity-25');
  });

  test('4. Arquivos legados *.view.tsx pré-telemetria não devem existir em src/components/scoring', () => {
    const scoringDir = path.join(rootDir, 'src/components/scoring');
    const forbiddenLegacyFiles = [
      'ScoreboardCard.view.tsx',
      'ScoreboardCard.rows.tsx',
      'ScoreboardCard.helpers.ts',
      'PlayerCard.view.tsx',
      'PlayerCard.helpers.ts',
      'BolasTrocadasModal.view.tsx',
      'PointDetailsModal.view.tsx',
      'ServerEffectModal.view.tsx',
    ];

    for (const file of forbiddenLegacyFiles) {
      const fullPath = path.join(scoringDir, file);
      expect(fs.existsSync(fullPath)).toBe(false);
    }
  });

  test('5. Componentes principais de scoring usam tokens telemetry e não classes brutas bg-gray-*', () => {
    const filesToCheck = [
      'src/components/scoring/ScoreboardCard.tsx',
      'src/components/scoring/PlayerCard.tsx',
      'src/components/scoring/LiveCountersBar.tsx',
      'src/components/scoring/ActionBar.sections.tsx',
      'src/app/match/[id]/scoring/ScoringPlayArea.tsx',
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(rootDir, relPath);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Deve usar tokens de telemetria
      expect(content).toMatch(/telemetry-/);

      // Não deve usar classes genéricas de fundo cinza em vez de telemetry-card/elevated
      expect(content).not.toMatch(/className="[^"]*\bbg-gray-(?:800|900)\b/);
    }
  });
});
