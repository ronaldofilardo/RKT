/**
 * Test de caracterização para o ADR‑0001 – Adoção de Sistema Multi‑Agente.
 * Verifica que o arquivo ADR contém a seção "Status" e que o valor não está vazio.
 */

test('ADR‑0001 contém status definido', () => {
  const fs = require('fs');
  const path = require('path');
  const adrPath = path.resolve(__dirname, '..', 'ADR-0001-adocao-multiagente.md');
  const content = fs.readFileSync(adrPath, 'utf8');
  const match = content.match(/^\*\*Status:\*\*\s+(.*)$/m);
  expect(match).not.toBeNull();
  const status = match ? match[1].trim() : '';
  expect(status.length).toBeGreaterThan(0);
});
