import { calculateEffectiveAge, syncRankingsWithAgeAndGender } from '../ranking-sync.logic';
import { createEmptyRankingState } from '../edit-athlete-modal.logic';
import type { RankingType } from '@/lib/ranking/rankingConstants';

function makeRankings(): Record<RankingType, any> {
  return {
    ESTADUAL: { ...createEmptyRankingState(), enabled: true, class: '1ªMA', position: '10' },
    CBT: { ...createEmptyRankingState(), enabled: true, category: '13-14', position: '5' },
    COSAT: { ...createEmptyRankingState(), enabled: true, category: '13-14', position: '2' },
    ITF: createEmptyRankingState(),
    ITF_Juniors: createEmptyRankingState(),
    ATP: { ...createEmptyRankingState(), enabled: true, position: '100' },
    WTA: createEmptyRankingState(),
  };
}

describe('ranking-sync.logic', () => {
  describe('calculateEffectiveAge', () => {
    const currentYear = new Date().getFullYear();

    it('calcula a idade corretamente para ano de 4 dígitos válido', () => {
      expect(calculateEffectiveAge('2007')).toBe(currentYear - 2007);
      expect(calculateEffectiveAge('1990')).toBe(currentYear - 1990);
    });

    it('retorna fallback ou null para entradas parciais ou inválidas', () => {
      expect(calculateEffectiveAge('', 25)).toBe(25);
      expect(calculateEffectiveAge('2', 25)).toBe(25);
      expect(calculateEffectiveAge('20', null)).toBeNull();
      expect(calculateEffectiveAge('200', null)).toBeNull();
      expect(calculateEffectiveAge('1899', null)).toBeNull();
      expect(calculateEffectiveAge('9999', null)).toBeNull();
    });
  });

  describe('syncRankingsWithAgeAndGender', () => {
    it('ao trocar para idade adulta (19 anos), desabilita rankings juvenis e limpa categoria do Estadual', () => {
      const prev = makeRankings();
      const synced = syncRankingsWithAgeAndGender(prev, 19, 'MALE');

      // CBT e COSAT não são permitidos para 19 anos -> desabilitados e resetados
      expect(synced.CBT.enabled).toBe(false);
      expect(synced.CBT.category).toBe('');
      expect(synced.COSAT.enabled).toBe(false);
      expect(synced.COSAT.category).toBe('');

      // Estadual permanece ativo mas sem categoria etária (adulto joga por classe)
      expect(synced.ESTADUAL.enabled).toBe(true);
      expect(synced.ESTADUAL.category).toBe('');
      expect(synced.ESTADUAL.class).toBe('1ªMA');

      // ATP permanece ativo
      expect(synced.ATP.enabled).toBe(true);
      expect(synced.ATP.position).toBe('100');
    });

    it('ao trocar para idade juvenil (14 anos), atribui categoria etária automática 13-14 ao Estadual', () => {
      const prev = makeRankings();
      prev.ESTADUAL.category = '';
      const synced = syncRankingsWithAgeAndGender(prev, 14, 'MALE');

      expect(synced.ESTADUAL.enabled).toBe(true);
      expect(synced.ESTADUAL.category).toBe('13-14');
      expect(synced.CBT.enabled).toBe(true);
    });

    it('ao trocar para veterano (40 anos), adapta categoria 40-44 e classe para MB', () => {
      const prev = makeRankings();
      prev.ESTADUAL.class = '1ªMA';
      const synced = syncRankingsWithAgeAndGender(prev, 40, 'MALE');

      expect(synced.ESTADUAL.category).toBe('40-44');
      expect(synced.ESTADUAL.class).toBe('1ªMB');
      expect(synced.CBT.enabled).toBe(false);
    });

    it('ao trocar gênero para FEMALE, desabilita ATP e adapta classe para FA', () => {
      const prev = makeRankings();
      prev.ESTADUAL.class = '1ªMA';
      const synced = syncRankingsWithAgeAndGender(prev, 25, 'FEMALE');

      expect(synced.ATP.enabled).toBe(false);
      expect(synced.ESTADUAL.class).toBe('1ªFA');
    });
  });
});

