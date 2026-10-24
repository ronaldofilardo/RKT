import type { NewMatchState } from './useNewMatchState';

export function getMissingFields(state: NewMatchState): string[] {
  const missing: string[] = [];
  if (!state.sportType) missing.push('Esporte');
  if (!state.format) missing.push('Modo de Jogo');
  if (state.sportType === 'TENNIS' && !state.courtType) missing.push('Tipo de Quadra');
  if (!state.date) missing.push('Data');

  if (state.matchType === 'DOUBLES') {
    if (!state.selectedP1) missing.push('Jogador 1 (Dupla 1)');
    if (!state.selectedP1Partner) missing.push('Parceiro 1 (Dupla 1)');
    if (!state.selectedP2) missing.push('Jogador 2 (Dupla 2)');
    if (!state.selectedP2Partner) missing.push('Parceiro 2 (Dupla 2)');

    if (state.selectedP1 && state.selectedP1Partner && state.selectedP2 && state.selectedP2Partner) {
      const ids = [
        state.selectedP1.id,
        state.selectedP1Partner.id,
        state.selectedP2.id,
        state.selectedP2Partner.id,
      ];
      const unique = new Set(ids);
      if (unique.size < 4) {
        missing.push('Os 4 jogadores devem ser atletas diferentes');
      }
    }
  } else {
    if (!state.selectedP1) missing.push('Jogador 1');
    if (!state.selectedP2) missing.push('Jogador 2');
    if (state.selectedP1 && state.selectedP2 && state.selectedP1.id === state.selectedP2.id) {
      missing.push('Jogador 1 e Jogador 2 devem ser diferentes');
    }
  }
  return missing;
}
