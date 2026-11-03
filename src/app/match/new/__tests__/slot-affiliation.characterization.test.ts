import {
  filterAthletesForSlot,
  initialSlotAffiliation,
  isOwnSlot,
  type SlotAffiliation,
  type SlotId,
} from '../slot-affiliation';
import type { Athlete } from '../types';

const athletes: Athlete[] = [
  { id: 'a1', name: 'Silva', clubId: 'ct-1', playerCts: [{ ctId: 'ct-1' }] },
  { id: 'a2', name: 'Santos', clubId: 'ct-2', playerCts: [{ ctId: 'ct-2' }] },
  { id: 'a3', name: 'Souza', clubId: null, playerCts: [] },
  { id: 'a4', name: 'Oliveira', clubId: 'ct-1', playerCts: [] },
];

describe('slot-affiliation characterization', () => {
  describe('initialSlotAffiliation', () => {
    it('retorna todos os slots como NOT_OWN por padrao', () => {
      const aff = initialSlotAffiliation();
      expect(aff.p1).toBe('NOT_OWN');
      expect(aff.p2).toBe('NOT_OWN');
      expect(aff.p1Partner).toBe('NOT_OWN');
      expect(aff.p2Partner).toBe('NOT_OWN');
    });
  });

  describe('isOwnSlot', () => {
    it('retorna true quando afiliacao e OWN e ctId existe', () => {
      expect(isOwnSlot('OWN', 'ct-1')).toBe(true);
    });

    it('retorna false quando afiliacao e NOT_OWN mesmo com ctId', () => {
      expect(isOwnSlot('NOT_OWN', 'ct-1')).toBe(false);
    });

    it('retorna false quando ctId e null mesmo com OWN', () => {
      expect(isOwnSlot('OWN', null)).toBe(false);
    });

    it('retorna false quando afiliacao e undefined', () => {
      expect(isOwnSlot(undefined, 'ct-1')).toBe(false);
    });
  });

  describe('filterAthletesForSlot', () => {
    it('com NOT_OWN retorna todos os atletas quando nao ha ctId', () => {
      const result = filterAthletesForSlot(athletes, 'NOT_OWN', null);
      expect(result).toHaveLength(4);
    });

    it('com OWN e ctId filtra apenas atletas do CT', () => {
      const result = filterAthletesForSlot(athletes, 'OWN', 'ct-1');
      expect(result.map((a) => a.id).sort()).toEqual(['a1', 'a4']);
    });

    it('com OWN e ctId null sem followedPlayerIds retorna vazio (nenhum atleta)', () => {
      const result = filterAthletesForSlot(athletes, 'OWN', null);
      expect(result).toHaveLength(0);
    });

    it('com OWN e ctId null com followedPlayerIds retorna apenas os atletas vinculados', () => {
      const result = filterAthletesForSlot(athletes, 'OWN', null, ['a1', 'a3']);
      expect(result.map((a) => a.id).sort()).toEqual(['a1', 'a3']);
    });

    it('com NOT_OWN e ctId null com followedPlayerIds exclui os atletas vinculados', () => {
      const result = filterAthletesForSlot(athletes, 'NOT_OWN', null, ['a1']);
      expect(result.map((a) => a.id).sort()).toEqual(['a2', 'a3', 'a4']);
    });

    it('com OWN e ctId sem jogadores correspondentes retorna vazio', () => {
      const result = filterAthletesForSlot(athletes, 'OWN', 'ct-99');
      expect(result).toHaveLength(0);
    });

    it('considera playerCts e clubId no filtro OWN', () => {
      const result = filterAthletesForSlot(athletes, 'OWN', 'ct-1');
      expect(result.some((a) => a.id === 'a4')).toBe(true);
    });

    it('com NOT_OWN e ctId exclui atletas do meu clube (apenas outros clubes)', () => {
      const result = filterAthletesForSlot(athletes, 'NOT_OWN', 'ct-1');
      expect(result.map((a) => a.id).sort()).toEqual(['a2', 'a3']);
    });

    it('com NOT_OWN e ctId inclui atletas sem clube (clubId null)', () => {
      const result = filterAthletesForSlot(athletes, 'NOT_OWN', 'ct-1');
      expect(result.some((a) => a.id === 'a3')).toBe(true);
    });
  });
});
