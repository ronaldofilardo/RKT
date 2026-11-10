import { getShortcuts } from '../dashboard-shortcuts.logic';

describe('Characterization — dashboard-shortcuts.logic baseline', () => {
  it('retorna atalhos estáticos para TREINADOR_CLUBE sem contadores', () => {
    const shortcuts = getShortcuts('TREINADOR_CLUBE');
    const keys = shortcuts.map((s) => s.key);
    expect(keys).toEqual(['nova', 'minhas', 'atletas', 'relatorios']);

    const atletasShortcut = shortcuts.find((s) => s.key === 'atletas');
    expect(atletasShortcut?.label).toBe('Meus Atletas');
    expect(atletasShortcut?.href).toBe('/atletas');
  });

  it('retorna atalhos estáticos para ANOTADOR sem contadores', () => {
    const shortcuts = getShortcuts('ANOTADOR');
    const keys = shortcuts.map((s) => s.key);
    expect(keys).toEqual(['nova', 'minhas', 'relatorios', 'atletas']);
  });
});

