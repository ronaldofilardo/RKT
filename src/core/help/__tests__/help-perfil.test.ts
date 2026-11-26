import { hasHelpContent, perfilSlugForArea, showHelpEntry } from '../help-perfil.logic';

describe('help-perfil.logic.ts', () => {
  it('mapeia cada área com conteúdo para o slug canônico', () => {
    expect(perfilSlugForArea('ATLETA')).toBe('atleta');
    expect(perfilSlugForArea('ANOTADOR')).toBe('anotador');
    expect(perfilSlugForArea('ESPECTADOR')).toBe('espectador');
    expect(perfilSlugForArea('GESTOR')).toBe('gestor');
    expect(perfilSlugForArea('TREINADOR_CLUBE')).toBe('treinador');
    expect(perfilSlugForArea('TREINADOR_AVULSO')).toBe('treinador');
    expect(perfilSlugForArea('RESPONSAVEL')).toBe('responsavel');
  });

  it('ADMIN e SUPORTE ficam de fora do conteúdo', () => {
    expect(hasHelpContent('ADMIN')).toBe(false);
    expect(hasHelpContent('SUPORTE')).toBe(false);
    expect(perfilSlugForArea('ADMIN')).toBeNull();
    expect(perfilSlugForArea('SUPORTE')).toBeNull();
  });

  it('área ausente ou desconhecida não gera slug', () => {
    expect(perfilSlugForArea(null)).toBeNull();
    expect(perfilSlugForArea(undefined)).toBeNull();
    expect(perfilSlugForArea('')).toBeNull();
    expect(perfilSlugForArea('INEXISTENTE')).toBeNull();
    expect(hasHelpContent(null)).toBe(false);
    expect(hasHelpContent('INEXISTENTE')).toBe(false);
  });

  it('showHelpEntry: com área, depende de haver conteúdo para ela', () => {
    expect(showHelpEntry('ATLETA', 'ADMIN')).toBe(true);
    expect(showHelpEntry('GESTOR', null)).toBe(true);
    expect(showHelpEntry('ADMIN', 'ADMIN')).toBe(false);
    expect(showHelpEntry('SUPORTE', 'ADMIN')).toBe(false);
    expect(showHelpEntry('INEXISTENTE', null)).toBe(false);
  });

  it('showHelpEntry: sem área, oculta apenas ADMIN/SUPORTE (fallback do rodapé)', () => {
    expect(showHelpEntry(null, 'ANNOTATOR')).toBe(true);
    expect(showHelpEntry(null, null)).toBe(true);
    expect(showHelpEntry(undefined, 'ADMIN')).toBe(false);
    expect(showHelpEntry(null, 'SUPORTE')).toBe(false);
  });
});
