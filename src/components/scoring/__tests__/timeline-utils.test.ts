import {
  enrichPointsFromHistory,
  filterTimelinePoints,
  countByFilter,
  getGameScoreLabelForPoint,
  formatAceOrDf,
  situacaoLabel,
  golpeLabel,
  direcaoLabel,
  efeitoLabel,
  golpeEspLabel,
  subtipo1Label,
  subtipo2Label,
  tipoLabel,
  vencedorLabel,
  validateRallyDetails,
  validateSituacao,
  validateTipo,
  validateGolpe,
  validateEfeito,
  validateDirecao,
  validateGolpeEsp,
  isValidRallyDetails,
  formatPointDetails,
  formatPointDetailsShort,
  formatPointDetailsFull,
  getPointDetailSummary,
} from '../timeline-utils';
import type { HistoryEntry, PointDetails, ScoringState } from '@/core/scoring/types';

const player1Id = 'player-1';
const player2Id = 'player-2';

function createHistoryEntry(
  point: Partial<PointDetails>,
  stateBefore: Partial<ScoringState>
): HistoryEntry {
  const defaultPoint: PointDetails = {
    winnerId: player1Id,
    type: 'WINNER',
    isFirstServe: true,
    isSecondServe: false,
    isLet: false,
    serverId: player1Id,
    timestamp: Date.now(),
    rallyLength: 5,
  };

  const defaultState: ScoringState = {
    sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };

  return {
    point: { ...defaultPoint, ...point },
    stateBefore: { ...defaultState, ...stateBefore },
  };
}

describe('timeline-utils', () => {
  describe('enrichPointsFromHistory', () => {
    it('deve enriquecer pontos com informações de estado', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player1Id, type: 'WINNER' },
          { sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }], currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false } }
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points).toHaveLength(1);
      expect(points[0].winner).toBe('PLAYER_1');
      expect(points[0].pointNumber).toBe(1);
    });

    it('deve identificar corretamente PLAYER_2 como winner', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player2Id, type: 'WINNER' },
          {}
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].winner).toBe('PLAYER_2');
    });

    it('deve calcular setNumber corretamente', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player1Id },
          { sets: [] }
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].setNumber).toBe(1);
    });

    it('deve detectar break point quando receptor tem games iguais ou mais', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player2Id },
          {
            sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
            server: 'player1',
          }
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].isBreakPoint).toBe(true);
    });

    it('não deve marcar break point se servidor está vencendo', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player2Id },
          {
            sets: [{ player1: 5, player2: 3, isTiebreak: false, tiebreakScore: null }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
            server: 'player1',
          }
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].isBreakPoint).toBe(false);
    });

    it('deve marcar isTiebreak corretamente', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player1Id },
          {
            sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 1, player2: 0 } }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          }
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].isTiebreak).toBe(true);
    });

    it('deve definir rallyLength para 1 em ACE ou DOUBLE_FAULT', () => {
      const aceHistory = [
        createHistoryEntry(
          { winnerId: player1Id, type: 'ACE', rallyLength: undefined },
          {}
        ),
      ];

      const dfHistory = [
        createHistoryEntry(
          { winnerId: player2Id, type: 'DOUBLE_FAULT', rallyLength: undefined },
          {}
        ),
      ];

      const acePoints = enrichPointsFromHistory(aceHistory, player1Id, player2Id);
      const dfPoints = enrichPointsFromHistory(dfHistory, player1Id, player2Id);

      expect(acePoints[0].rallyLength).toBe(1);
      expect(dfPoints[0].rallyLength).toBe(1);
    });

    it('deve propagar firstFaultDetail em DOUBLE_FAULT', () => {
      const history = [
        createHistoryEntry(
          {
            winnerId: player2Id,
            type: 'DOUBLE_FAULT',
            firstFaultDetail: { errorType: 'REDE', serveEffect: 'FATIO', direction: 'CRUZADO' },
          },
          {}
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].firstFault).toEqual({
        errorType: 'REDE',
        serveEffect: 'FATIO',
        direction: 'CRUZADO',
      });
    });

    it('deve retornar undefined em DOUBLE_FAULT sem firstFaultDetail', () => {
      const history = [
        createHistoryEntry(
          { winnerId: player2Id, type: 'DOUBLE_FAULT', firstFaultDetail: undefined },
          {}
        ),
      ];

      const points = enrichPointsFromHistory(history, player1Id, player2Id);

      expect(points[0].firstFault).toBeUndefined();
    });
  });

  describe('filterTimelinePoints', () => {
    const points = [
      { winner: 'PLAYER_1' as const, type: 'WINNER' as const, isBreakPoint: true, pointNumber: 1 },
      { winner: 'PLAYER_1' as const, type: 'ACE' as const, isBreakPoint: false, pointNumber: 2 },
      { winner: 'PLAYER_2' as const, type: 'UNFORCED_ERROR' as const, isBreakPoint: false, pointNumber: 3 },
      { winner: 'PLAYER_2' as const, type: 'DOUBLE_FAULT' as const, isBreakPoint: true, pointNumber: 4 },
    ] as any;

    it('deve filtrar por playerWinner', () => {
      const filtered = filterTimelinePoints(points, { playerWinner: 'PLAYER_1' });
      expect(filtered).toHaveLength(2);
    });

    it('deve filtrar por breakPointsOnly', () => {
      const filtered = filterTimelinePoints(points, { breakPointsOnly: true });
      expect(filtered).toHaveLength(2);
    });

    it('deve filtrar por winnersOnly', () => {
      const filtered = filterTimelinePoints(points, { winnersOnly: true });
      expect(filtered).toHaveLength(2);
    });

    it('deve filtrar por errorsOnly', () => {
      const filtered = filterTimelinePoints(points, { errorsOnly: true });
      expect(filtered).toHaveLength(2);
    });

    it('deve combinar filtros', () => {
      const filtered = filterTimelinePoints(points, {
        playerWinner: 'PLAYER_2',
        errorsOnly: true,
      });
      expect(filtered).toHaveLength(2);
    });
  });

  describe('countByFilter', () => {
    const points = [
      { winner: 'PLAYER_1' as const, type: 'WINNER' as const, isBreakPoint: true },
      { winner: 'PLAYER_1' as const, type: 'ACE' as const, isBreakPoint: false },
      { winner: 'PLAYER_2' as const, type: 'WINNER' as const, isBreakPoint: false },
      { winner: 'PLAYER_2' as const, type: 'DOUBLE_FAULT' as const, isBreakPoint: true },
    ] as any;

    it('deve contar pontos quebrados', () => {
      const count = countByFilter(points, (p) => p.isBreakPoint);
      expect(count).toBe(2);
    });

    it('deve contar winners de player1', () => {
      const count = countByFilter(points, (p) => p.winner === 'PLAYER_1' && (p.type === 'WINNER' || p.type === 'ACE'));
      expect(count).toBe(2);
    });
  });

  describe('getGameScoreLabelForPoint', () => {
    it('deve formatar score regular', () => {
      const point = { gameScore: { player1: 1, player2: 0 }, gameIsDeuce: false, gameAdvantage: null, isTiebreak: false } as any;
      expect(getGameScoreLabelForPoint(point)).toBe('15x0');
    });

    it('deve formatar 40x40 em deuce', () => {
      const point = { gameScore: { player1: 3, player2: 3 }, gameIsDeuce: true, gameAdvantage: null, isTiebreak: false } as any;
      expect(getGameScoreLabelForPoint(point)).toBe('40x40');
    });

    it('deve formatar AD para player1', () => {
      const point = { gameScore: { player1: 3, player2: 3 }, gameIsDeuce: true, gameAdvantage: 'player1', isTiebreak: false } as any;
      expect(getGameScoreLabelForPoint(point)).toBe('ADx40');
    });

    it('deve formatar tiebreak', () => {
      const point = { gameScore: { player1: 5, player2: 3 }, gameIsDeuce: false, gameAdvantage: null, isTiebreak: true } as any;
      expect(getGameScoreLabelForPoint(point)).toBe('5x3');
    });
  });

  describe('formatAceOrDf', () => {
    it('deve formatar ACE simples', () => {
      const point = { type: 'ACE', rallyDetails: null, firstFault: null } as any;
      expect(formatAceOrDf(point)).toBe('ACE');
    });

    it('deve formatar ACE com efeito e direção', () => {
      const point = {
        type: 'ACE',
        rallyDetails: { efeito: 'topspin', direcao: 'cruzada' },
        firstFault: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('ACE-TOP-CRU');
    });

    it('deve formatar ACE com efeito desconhecido (fallback to upper case)', () => {
      const point = {
        type: 'ACE',
        rallyDetails: { efeito: 'unknown_effect', direcao: 'cruzada' },
        firstFault: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('ACE-UNK-CRU');
    });

    it('deve formatar ACE com direção desconhecida (fallback to upper case)', () => {
      const point = {
        type: 'ACE',
        rallyDetails: { efeito: 'topspin', direcao: 'unknown_dir' },
        firstFault: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('ACE-TOP-UNK');
    });

    it('deve formatar DOUBLE_FAULT', () => {
      const point = {
        type: 'DOUBLE_FAULT',
        firstFault: { serveEffect: 'flat', direction: 'aberto' },
        rallyDetails: { efeito: 'slice', direcao: 'centro' },
      } as any;
      expect(formatAceOrDf(point)).toBe('DF: 1o.-Fla-Abe > 2o.-Sli-Cen');
    });

    it('deve formatar DOUBLE_FAULT com direction no firstFault', () => {
      const point = {
        type: 'DOUBLE_FAULT',
        firstFault: { serveEffect: 'slice', direction: 'paralela' },
        rallyDetails: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('DF: 1o.-Sli-Par > 2o.');
    });

    it('deve formatar DOUBLE_FAULT com firstFault sem serveEffect nem direction (linha 68)', () => {
      const point = {
        type: 'DOUBLE_FAULT',
        firstFault: {},
        rallyDetails: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('DF: 1o. > 2o.');
    });

    it('deve formatar FAULT_SECOND', () => {
      const point = {
        type: 'FAULT_SECOND',
        firstFault: { serveEffect: 'slice' },
        rallyDetails: null,
      } as any;
      expect(formatAceOrDf(point)).toBe('DF: 1o.-Sli > 2o.');
    });

    it('deve formatar FAULT_SECOND com rallyDetails', () => {
      const point = {
        type: 'FAULT_SECOND',
        firstFault: { serveEffect: 'flat' },
        rallyDetails: { efeito: 'topspin', direcao: 'cruzada' },
      } as any;
      expect(formatAceOrDf(point)).toBe('DF: 1o.-Fla > 2o.-Top-Cru');
    });

    it('deve retornar – para tipo desconhecido', () => {
      const point = { type: 'UNKNOWN_TYPE' } as any;
      expect(formatAceOrDf(point)).toBe('–');
    });
  });

  describe('label functions', () => {
    it('situacaoLabel deve mapear situações', () => {
      expect(situacaoLabel('devolucao')).toBe('Devolução');
      expect(situacaoLabel('fundo')).toBe('Fundo');
      expect(situacaoLabel('rede')).toBe('Rede');
      expect(situacaoLabel('passada')).toBe('Passada');
      expect(situacaoLabel('desconhecida')).toBe('desconhecida');
    });

    it('golpeLabel deve mapear golpes', () => {
      expect(golpeLabel('fh')).toBe('FH');
      expect(golpeLabel('bh')).toBe('BH');
      expect(golpeLabel('vfh')).toBe('VFH');
      expect(golpeLabel('vbh')).toBe('VBH');
      expect(golpeLabel('smash')).toBe('Smash');
    });

    it('direcaoLabel deve mapear direções', () => {
      expect(direcaoLabel('cruzada')).toBe('cruzada');
      expect(direcaoLabel('paralela')).toBe('paralela');
      expect(direcaoLabel('inside_out')).toBe('Inside-Out');
    });

    it('efeitoLabel deve retornar string', () => {
      expect(efeitoLabel('topspin')).toBe('topspin');
    });

    it('golpeEspLabel deve mapear golpes especiais', () => {
      expect(golpeEspLabel('lob')).toBe('lob');
      expect(golpeEspLabel('drop_shot')).toBe('drop');
      expect(golpeEspLabel('bate_pronto')).toBe('bate-pronto');
    });

    it('subtipo1Label deve mapear subtipos 1', () => {
      expect(subtipo1Label('passing_shot')).toBe('Passing Shot');
      expect(subtipo1Label('devolucao_saque')).toBe('Devolução');
    });

    it('subtipo2Label deve mapear subtipos 2', () => {
      expect(subtipo2Label('out')).toBe('out');
      expect(subtipo2Label('net')).toBe('net');
    });

    it('tipoLabel deve mapear tipos', () => {
      expect(tipoLabel('winner')).toBe('Winner');
      expect(tipoLabel('erro_nao_forcado')).toBe('Erro Não Forçado');
      expect(tipoLabel('erro_forcado')).toBe('Erro Forçado');
    });

    it('vencedorLabel deve mapear vencedor', () => {
      expect(vencedorLabel('sacador')).toBe('Sacador');
      expect(vencedorLabel('devolvedor')).toBe('Devolvedor');
    });
  });

  describe('validation functions', () => {
    const validRallyDetails = {
      vencedor: 'sacador' as const,
      situacao: 'fundo' as const,
      tipo: 'winner' as const,
      golpe: 'fh' as const,
      previewBalls: 3,
    };

    describe('validateRallyDetails', () => {
      it('deve validar RallyDetails completo', () => {
        const result = validateRallyDetails({
          ...validRallyDetails,
          efeito: 'topspin',
          direcao: 'cruzada',
        });
        expect(result.success).toBe(true);
      });

      it('deve aceitar RallyDetails sem campos opcionais', () => {
        const result = validateRallyDetails(validRallyDetails);
        expect(result.success).toBe(true);
      });

      it('deve falhar com dados inválidos', () => {
        const result = validateRallyDetails({ situacao: 'invalid' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(Object.keys(result.errors).length).toBeGreaterThan(0);
        }
      });

      it('deve falhar com tipo invalido', () => {
        const result = validateRallyDetails({ ...validRallyDetails, tipo: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('deve falhar com golpe invalido', () => {
        const result = validateRallyDetails({ ...validRallyDetails, golpe: 'invalid' });
        expect(result.success).toBe(false);
      });
    });

    describe('validateSituacao', () => {
      it('deve validar situacao valida', () => {
        expect(validateSituacao('fundo').success).toBe(true);
        expect(validateSituacao('rede').success).toBe(true);
        expect(validateSituacao('passada').success).toBe(true);
        expect(validateSituacao('devolucao').success).toBe(true);
      });

      it('deve falhar com situacao invalida', () => {
        const result = validateSituacao('invalid');
        expect(result.success).toBe(false);
      });
    });

    describe('validateTipo', () => {
      it('deve validar tipo valido', () => {
        expect(validateTipo('winner').success).toBe(true);
        expect(validateTipo('erro_forcado').success).toBe(true);
        expect(validateTipo('erro_nao_forcado').success).toBe(true);
      });

      it('deve falhar com tipo invalido', () => {
        expect(validateTipo('invalid').success).toBe(false);
      });
    });

    describe('validateGolpe', () => {
      it('deve validar golpe valido', () => {
        expect(validateGolpe('fh').success).toBe(true);
        expect(validateGolpe('bh').success).toBe(true);
        expect(validateGolpe('vfh').success).toBe(true);
        expect(validateGolpe('vbh').success).toBe(true);
        expect(validateGolpe('smash').success).toBe(true);
      });

      it('deve falhar com golpe invalido', () => {
        expect(validateGolpe('invalid').success).toBe(false);
      });
    });

    describe('validateEfeito', () => {
      it('deve validar efeito valido', () => {
        expect(validateEfeito('topspin').success).toBe(true);
        expect(validateEfeito('slice').success).toBe(true);
        expect(validateEfeito('flat').success).toBe(true);
      });

      it('deve falhar com efeito invalido', () => {
        expect(validateEfeito('invalid').success).toBe(false);
      });
    });

    describe('validateDirecao', () => {
      it('deve validar direcao valida', () => {
        expect(validateDirecao('cruzada').success).toBe(true);
        expect(validateDirecao('paralela').success).toBe(true);
        expect(validateDirecao('centro').success).toBe(true);
        expect(validateDirecao('inside_out').success).toBe(true);
        expect(validateDirecao('inside_in').success).toBe(true);
      });

      it('deve falhar com direcao invalida', () => {
        expect(validateDirecao('invalid').success).toBe(false);
      });
    });

    describe('validateGolpeEsp', () => {
      it('deve validar golpe_esp valido', () => {
        expect(validateGolpeEsp('lob').success).toBe(true);
        expect(validateGolpeEsp('drop_shot').success).toBe(true);
        expect(validateGolpeEsp('bate_pronto').success).toBe(true);
        expect(validateGolpeEsp('swing_volley').success).toBe(true);
      });

      it('deve falhar com golpe_esp invalido', () => {
        expect(validateGolpeEsp('invalid').success).toBe(false);
      });
    });

    describe('isValidRallyDetails', () => {
      it('deve retornar true para dados validos', () => {
        expect(isValidRallyDetails(validRallyDetails)).toBe(true);
      });

      it('deve retornar false para dados invalidos', () => {
        expect(isValidRallyDetails({})).toBe(false);
        expect(isValidRallyDetails(null)).toBe(false);
        expect(isValidRallyDetails(undefined)).toBe(false);
      });
    });
  });

  describe('formatPointDetails', () => {
    const completeRallyDetails = {
      vencedor: 'sacador' as const,
      situacao: 'fundo' as const,
      tipo: 'winner' as const,
      golpe: 'fh' as const,
      efeito: 'topspin' as const,
      direcao: 'cruzada' as const,
      golpe_esp: 'lob' as const,
      subtipo1: 'passing_shot' as const,
      subtipo2: 'out' as const,
      previewBalls: 5,
    };

    it('deve formatar rally details completo', () => {
      const result = formatPointDetails(completeRallyDetails);
      expect(result.tipo).toBe('Winner');
      expect(result.situacao).toBe('Fundo');
      expect(result.golpe).toBe('FH');
      expect(result.direcao).toBe('cruzada');
      expect(result.efeito).toBe('topspin');
      expect(result.golpeEsp).toBe('lob');
    });

    it('deve formatar rally details parcial', () => {
      const partial = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'winner' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = formatPointDetails(partial);
      expect(result.short).toBe('Fundo • FH');
      expect(result.golpe).toBe('FH');
    });

    it('deve retornar valores padrão para undefined', () => {
      const result = formatPointDetails(undefined);
      expect(result.short).toBe('–');
      expect(result.full).toBe('–');
      expect(result.tipo).toBe('–');
    });

    it('deve retornar valores padrão para null', () => {
      const result = formatPointDetails(null);
      expect(result.short).toBe('–');
      expect(result.full).toBe('–');
    });

    it('short deve conter situacao e golpe', () => {
      const result = formatPointDetails(completeRallyDetails);
      expect(result.short).toContain('Fundo');
      expect(result.short).toContain('FH');
    });

    it('full deve conter todos os campos', () => {
      const result = formatPointDetails(completeRallyDetails);
      expect(result.full).toContain('Sacador');
      expect(result.full).toContain('Fundo');
      expect(result.full).toContain('Winner');
      expect(result.full).toContain('FH');
    });
  });

  describe('formatPointDetailsShort', () => {
    it('deve retornar versão curta', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'rede' as const, tipo: 'winner' as const, golpe: 'vfh' as const, previewBalls: 1 };
      expect(formatPointDetailsShort(rd)).toContain('Rede');
      expect(formatPointDetailsShort(rd)).toContain('VFH');
    });

    it('deve retornar – para null', () => {
      expect(formatPointDetailsShort(null)).toBe('–');
    });
  });

  describe('formatPointDetailsFull', () => {
    it('deve retornar versão completa', () => {
      const rd = { vencedor: 'devolvedor' as const, situacao: 'fundo' as const, tipo: 'erro_forcado' as const, golpe: 'bh' as const, previewBalls: 2 };
      expect(formatPointDetailsFull(rd)).toContain('Devolvedor');
      expect(formatPointDetailsFull(rd)).toContain('Fundo');
    });
  });

  describe('getPointDetailSummary', () => {
    it('deve retornar green para winner', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'winner' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.label).toBe('Winner');
      expect(result.color).toBe('green');
    });

    it('deve retornar red para erro_nao_forcado', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'erro_nao_forcado' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.label).toBe('ENF');
      expect(result.color).toBe('red');
    });

    it('deve retornar amber para erro_forcado', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'erro_forcado' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.label).toBe('EF');
      expect(result.color).toBe('amber');
    });

    it('deve retornar gray para undefined', () => {
      const result = getPointDetailSummary(undefined);
      expect(result.label).toBe('–');
      expect(result.color).toBe('gray');
    });

    it('deve retornar gray e label da tipo para ACE', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'ace' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.color).toBe('gray');
    });

    it('deve retornar gray e label da tipo para DOUBLE_FAULT', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'double_fault' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.color).toBe('gray');
    });

    it('deve retornar gray e label da tipo para FORCED_ERROR', () => {
      const rd = { vencedor: 'sacador' as const, situacao: 'fundo' as const, tipo: 'forced_error' as const, golpe: 'fh' as const, previewBalls: 1 };
      const result = getPointDetailSummary(rd);
      expect(result.color).toBe('gray');
    });
  });
});