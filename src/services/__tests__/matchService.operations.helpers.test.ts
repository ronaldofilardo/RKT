import {
  ALLOWED_MATCH_FIELDS,
  sanitizeMatchUpdate,
  buildMatchUpdateData,
  buildFinishUpdateData,
} from '../matchService.operations.helpers';

describe('matchService.operations.helpers', () => {
  describe('ALLOWED_MATCH_FIELDS', () => {
    it('deve conter os campos esperados', () => {
      expect(ALLOWED_MATCH_FIELDS).toContain('nickname');
      expect(ALLOWED_MATCH_FIELDS).toContain('sportType');
      expect(ALLOWED_MATCH_FIELDS).toContain('courtType');
      expect(ALLOWED_MATCH_FIELDS).toContain('visibility');
      expect(ALLOWED_MATCH_FIELDS).toContain('openForAnnotation');
      expect(ALLOWED_MATCH_FIELDS).toContain('scheduledAt');
      expect(ALLOWED_MATCH_FIELDS).toContain('initialServerId');
      expect(ALLOWED_MATCH_FIELDS).toContain('tournamentName');
      expect(ALLOWED_MATCH_FIELDS).toContain('category');
      expect(ALLOWED_MATCH_FIELDS).toContain('roundName');
      expect(ALLOWED_MATCH_FIELDS).toContain('bracketType');
      expect(ALLOWED_MATCH_FIELDS).toContain('temperature');
      expect(ALLOWED_MATCH_FIELDS).toContain('humidity');
    });
  });

  describe('sanitizeMatchUpdate', () => {
    it('deve retornar objeto vazio quando nenhum campo permitido é fornecido', () => {
      expect(sanitizeMatchUpdate({ invalid: 'value' })).toEqual({});
    });

    it('deve extrair apenas campos permitidos', () => {
      const result = sanitizeMatchUpdate({
        nickname: 'Teste',
        invalid: 'ignored',
        sportType: 'TENNIS',
      });
      expect(result).toEqual({ nickname: 'Teste', sportType: 'TENNIS' });
    });

    it('deve excluir campos com valor undefined', () => {
      const result = sanitizeMatchUpdate({ nickname: undefined });
      expect(result).not.toHaveProperty('nickname');
    });

    it('deve lidar com objeto vazio', () => {
      expect(sanitizeMatchUpdate({})).toEqual({});
    });
  });

  describe('buildMatchUpdateData', () => {
    it('deve retornar objeto vazio quando sanitized está vazio', () => {
      expect(buildMatchUpdateData({})).toEqual({});
    });

    it('deve copiar campos simples diretamente', () => {
      const result = buildMatchUpdateData({
        nickname: 'Partida',
        sportType: 'TENNIS',
        courtType: 'CLAY',
        visibility: 'PRIVATE',
        openForAnnotation: true,
      });
      expect(result).toEqual({
        nickname: 'Partida',
        sportType: 'TENNIS',
        courtType: 'CLAY',
        visibility: 'PRIVATE',
        openForAnnotation: true,
      });
    });

    it('deve converter scheduledAt para Date', () => {
      const result = buildMatchUpdateData({
        scheduledAt: '2026-08-01T10:00:00Z',
      });
      expect(result.scheduledAt).toBeInstanceOf(Date);
    });

    it('nao deve incluir scheduledAt quando undefined', () => {
      const result = buildMatchUpdateData({});
      expect(result).not.toHaveProperty('scheduledAt');
    });

    it('deve incluir todos os campos quando fornecidos', () => {
      const sanitized = {
        nickname: 'N',
        sportType: 'S',
        courtType: 'C',
        visibility: 'V',
        openForAnnotation: true,
        scheduledAt: '2026-01-01',
        initialServerId: 'p1',
        tournamentName: 'T',
        category: 'A',
        roundName: 'R',
        bracketType: 'B',
        temperature: 25,
        humidity: 60,
      };
      const result = buildMatchUpdateData(sanitized);

      expect(result).toEqual({
        nickname: 'N',
        sportType: 'S',
        courtType: 'C',
        visibility: 'V',
        openForAnnotation: true,
        scheduledAt: new Date('2026-01-01'),
        initialServerId: 'p1',
        tournamentName: 'T',
        category: 'A',
        roundName: 'R',
        bracketType: 'B',
        temperature: 25,
        humidity: 60,
      });
    });
  });

  describe('buildFinishUpdateData', () => {
    it('deve criar dados de finish com defaults', () => {
      const result = buildFinishUpdateData({ sets: [] });

      expect(result.state).toBe('FINISHED');
      expect(result.finishedAt).toBeInstanceOf(Date);
      expect(result.finishReason).toBe('COMPLETED');
      expect(result.scoreState).toEqual({ sets: [] });
    });

    it('deve usar reason fornecido', () => {
      const result = buildFinishUpdateData({}, 'RETIRED');
      expect(result.finishReason).toBe('RETIRED');
    });

    it('deve incluir scoreState quando fornecido', () => {
      const score = { sets: [{ player1: 6, player2: 4 }] };
      const result = buildFinishUpdateData(score);
      expect(result.scoreState).toEqual(score);
    });

    it('nao deve incluir scoreState quando null', () => {
      const result = buildFinishUpdateData(null);
      expect(result).not.toHaveProperty('scoreState');
    });

    it('deve incluir note quando fornecido', () => {
      const result = buildFinishUpdateData({}, 'COMPLETED', 'Lesão');
      expect(result.finishNote).toBe('Lesão');
    });

    it('nao deve incluir note quando undefined', () => {
      const result = buildFinishUpdateData({});
      expect(result).not.toHaveProperty('finishNote');
    });

    it('deve incluir winnerId quando fornecido', () => {
      const result = buildFinishUpdateData({}, 'COMPLETED', undefined, 'p1');
      expect(result.winnerId).toBe('p1');
    });

    it('nao deve incluir winnerId quando undefined', () => {
      const result = buildFinishUpdateData({});
      expect(result).not.toHaveProperty('winnerId');
    });
  });
});
