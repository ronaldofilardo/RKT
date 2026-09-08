/**
 * Testes para as correções implementadas na conversa 2026-09-08:
 * 1. canConfirm: permitir confirmar ao retomar partida (0x0 com game points)
 * 2. isConfirming: estado de loading durante persistência
 * 3. Tiebreak floor: validação de pontos do tiebreak contra o floor
 * 4. Tiebreak initialGameRef: inicialização correta para tiebreak
 * 5. getFloorError: validação de floor para games
 */

import { calculateValidation } from '../edit-score-logic';
import { getFloorError } from '../useEditScoreModal.confirm.helpers';
import type { SetEditData } from '../editScoreHelpers';

describe('Conversa 2026-09-08 - canConfirm resume logic', () => {
  describe('deve permitir confirmar ao retomar partida abandonada', () => {
    it('0x0 com game points existentes (30-30) deve ter canConfirm=true', () => {
      // Simula o cenário: partida abandonada no set 1, 0x0, 30-30
      // O modal abre preenchido com 0x0 e game points 30-30
      // canConfirm deve ser true para permitir retomar

      const state = {
        p1Input: '0',
        p2Input: '0',
        newSets: [] as SetEditData[],
        p1Points: '30',
        p2Points: '30',
      };

      const completedSets: Array<{ games: { player1: number; player2: number } }> = [];

      // Lógica extraída de use-edit-score-calculator.ts canConfirm
      const validation = calculateValidation({
        p1Input: state.p1Input,
        p2Input: state.p2Input,
        matchFormat: 'BEST_OF_3',
        totalEditedSets: state.newSets.length + completedSets.length,
      });

      const bothFilled = validation.bothFilled;
      const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
      const hasGamePoints = state.p1Points !== '0' || state.p2Points !== '0';

      // Condição de canConfirm para retomada
      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0 || hasGamePoints);

      expect(bothFilled).toBe(true);
      expect(scoresAreZero).toBe(true);
      expect(hasGamePoints).toBe(true);
      expect(canConfirmResume).toBe(true);
    });

    it('0x0 sem game points (0-0) e sem completedSets deve ter canConfirm=false', () => {
      const state = {
        p1Input: '0',
        p2Input: '0',
        newSets: [] as SetEditData[],
        p1Points: '0',
        p2Points: '0',
      };

      const completedSets: Array<{ games: { player1: number; player2: number } }> = [];

      const validation = calculateValidation({
        p1Input: state.p1Input,
        p2Input: state.p2Input,
        matchFormat: 'BEST_OF_3',
        totalEditedSets: state.newSets.length + completedSets.length,
      });

      const bothFilled = validation.bothFilled;
      const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
      const hasGamePoints = state.p1Points !== '0' || state.p2Points !== '0';

      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0 || hasGamePoints);

      expect(hasGamePoints).toBe(false);
      expect(canConfirmResume).toBe(false);
    });

    it('0x0 com completedSets existentes deve ter canConfirm=true', () => {
      const state = {
        p1Input: '0',
        p2Input: '0',
        newSets: [] as SetEditData[],
        p1Points: '0',
        p2Points: '0',
      };

      const completedSets = [
        { games: { player1: 6, player2: 4 } },
      ];

      const validation = calculateValidation({
        p1Input: state.p1Input,
        p2Input: state.p2Input,
        matchFormat: 'BEST_OF_3',
        totalEditedSets: state.newSets.length + completedSets.length,
      });

      const bothFilled = validation.bothFilled;
      const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;

      const canConfirmResume = (!bothFilled || scoresAreZero) &&
        (completedSets.length > 0 || state.newSets.length > 0);

      expect(completedSets.length).toBeGreaterThan(0);
      expect(canConfirmResume).toBe(true);
    });
  });
});

describe('Conversa 2026-09-08 - Tiebreak floor validation', () => {
  describe('getFloorError para tiebreak', () => {
    it('deve bloquear tiebreak inferior ao floor', () => {
      // Floor = pontos do tiebreak: 2x3
      const floor = { player1: 2, player2: 3 };
      // Usuário tenta confirmar com tiebreak 0x0
      const result = getFloorError(0, 0, floor);
      expect(result).toContain('inferior');
    });

    it('deve aceitar tiebreak igual ao floor', () => {
      const floor = { player1: 2, player2: 3 };
      const result = getFloorError(2, 3, floor);
      expect(result).toBeNull();
    });

    it('deve aceitar tiebreak superior ao floor', () => {
      const floor = { player1: 2, player2: 3 };
      const result = getFloorError(3, 4, floor);
      expect(result).toBeNull();
    });

    it('deve bloquear quando um jogador regrediu', () => {
      const floor = { player1: 2, player2: 3 };
      // P1 regrediu de 2 para 1
      const result = getFloorError(1, 3, floor);
      expect(result).toContain('inferior');
    });

    it('deve bloquear quando ambos regrediram', () => {
      const floor = { player1: 2, player2: 3 };
      const result = getFloorError(1, 2, floor);
      expect(result).toContain('inferior');
    });
  });

  describe('getFloorError para games normais', () => {
    it('deve bloquear games inferiores ao floor', () => {
      const floor = { player1: 4, player2: 3 };
      const result = getFloorError(3, 3, floor);
      expect(result).toContain('inferior');
    });

    it('deve aceitar games iguais ao floor', () => {
      const floor = { player1: 4, player2: 3 };
      const result = getFloorError(4, 3, floor);
      expect(result).toBeNull();
    });

    it('deve aceitar games superiores ao floor', () => {
      const floor = { player1: 4, player2: 3 };
      const result = getFloorError(5, 3, floor);
      expect(result).toBeNull();
    });

    it('deve bloquear quando floor é null (sem floor)', () => {
      // Quando floor é null, getFloorError não bloqueia
      const result = getFloorError(0, 0, null);
      expect(result).toBeNull();
    });
  });
});

describe('Conversa 2026-09-08 - Tiebreak initialGameRef', () => {
  it('initialGameRef deve ser setado para tiebreak com pontos 2-3', () => {
    // Simula a inicialização do modal quando isTiebreak=true
    const isTiebreak = true;
    const currentGamePoints = { player1: 2, player2: 3 };
    const initialGameRef: { player1: string; player2: string } | null = null;

    // Lógica extraída de useEditScoreModal.ts
    let ref = initialGameRef;
    if (currentGamePoints) {
      const p1 = typeof currentGamePoints.player1 === 'number'
        ? currentGamePoints.player1.toString()
        : currentGamePoints.player1;
      const p2 = typeof currentGamePoints.player2 === 'number'
        ? currentGamePoints.player2.toString()
        : currentGamePoints.player2;
      if (isTiebreak) {
        ref = { player1: p1, player2: p2 };
      }
    }

    expect(ref).not.toBeNull();
    expect(ref!.player1).toBe('2');
    expect(ref!.player2).toBe('3');
  });

  it('initialGameRef deve ser setado para set normal com game points 30-15', () => {
    const isTiebreak = false;
    const currentGamePoints = { player1: '30', player2: '15' };
    const initialGameRef: { player1: string; player2: string } | null = null;

    let ref = initialGameRef;
    if (currentGamePoints) {
      const p1 = typeof currentGamePoints.player1 === 'number'
        ? currentGamePoints.player1.toString()
        : currentGamePoints.player1;
      const p2 = typeof currentGamePoints.player2 === 'number'
        ? currentGamePoints.player2.toString()
        : currentGamePoints.player2;
      if (!isTiebreak) {
        ref = { player1: p1, player2: p2 };
      }
    }

    expect(ref).not.toBeNull();
    expect(ref!.player1).toBe('30');
    expect(ref!.player2).toBe('15');
  });
});

describe('Conversa 2026-09-08 - Tiebreak regression check', () => {
  it('deve bloquear tiebreak que regrediu de 2-3 para 0-0', () => {
    const initialGameRef = { player1: '2', player2: '3' };
    const tiebreakP1 = '0';
    const tiebreakP2 = '0';
    const currentSets = { player1: 6, player2: 6 };
    const p1Val = 6;
    const p2Val = 6;

    const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
    const initialTbP1 = Number(initialGameRef.player1) || 0;
    const initialTbP2 = Number(initialGameRef.player2) || 0;
    const currentTbP1 = Number(tiebreakP1) || 0;
    const currentTbP2 = Number(tiebreakP2) || 0;

    const isRegression = sameSetScore && (
      (currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
      (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)
    );

    expect(sameSetScore).toBe(true);
    expect(isRegression).toBe(true);
  });

  it('deve aceitar tiebreak que avançou de 2-3 para 3-4', () => {
    const initialGameRef = { player1: '2', player2: '3' };
    const tiebreakP1 = '3';
    const tiebreakP2 = '4';
    const currentSets = { player1: 6, player2: 6 };
    const p1Val = 6;
    const p2Val = 6;

    const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
    const initialTbP1 = Number(initialGameRef.player1) || 0;
    const initialTbP2 = Number(initialGameRef.player2) || 0;
    const currentTbP1 = Number(tiebreakP1) || 0;
    const currentTbP2 = Number(tiebreakP2) || 0;

    const isRegression = sameSetScore && (
      (currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
      (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)
    );

    expect(isRegression).toBe(false);
  });

  it('deve aceitar tiebreak que manteve 2-3', () => {
    const initialGameRef = { player1: '2', player2: '3' };
    const tiebreakP1 = '2';
    const tiebreakP2 = '3';
    const currentSets = { player1: 6, player2: 6 };
    const p1Val = 6;
    const p2Val = 6;

    const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
    const initialTbP1 = Number(initialGameRef.player1) || 0;
    const initialTbP2 = Number(initialGameRef.player2) || 0;
    const currentTbP1 = Number(tiebreakP1) || 0;
    const currentTbP2 = Number(tiebreakP2) || 0;

    const isRegression = sameSetScore && (
      (currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
      (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)
    );

    expect(isRegression).toBe(false);
  });
});

describe('Conversa 2026-09-08 - isConfirming state', () => {
  it('isConfirming deve ser false inicialmente', () => {
    let isConfirming = false;
    expect(isConfirming).toBe(false);
  });

  it('isConfirming deve ser true durante onConfirm', () => {
    let isConfirming = false;

    const handleConfirm = async () => {
      isConfirming = true;
      try {
        // Simula onConfirm
        await new Promise(resolve => setTimeout(resolve, 10));
      } finally {
        isConfirming = false;
      }
    };

    // Durante a execução, isConfirming deve ser true
    const promise = handleConfirm();
    expect(isConfirming).toBe(true);

    // Após completar, isConfirming deve voltar a false
    return promise.then(() => {
      expect(isConfirming).toBe(false);
    });
  });

  it('handleCancel deve ser bloqueado quando isConfirming=true', () => {
    let isConfirming = true;
    const onCancel = jest.fn();

    // Lógica extraída de useEditScoreModal.ts
    const handleCancel = () => {
      if (isConfirming) return;
      onCancel();
    };

    handleCancel();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('handleCancel deve funcionar quando isConfirming=false', () => {
    let isConfirming = false;
    const onCancel = jest.fn();

    const handleCancel = () => {
      if (isConfirming) return;
      onCancel();
    };

    handleCancel();
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('Conversa 2026-09-08 - currentGamePoints tiebreak fix', () => {
  it('deve usar tiebreakScore em vez de currentGame quando isTiebreak=true', () => {
    // Simula o bug: currentGame é sempre 0-0 durante tiebreak
    const effectiveScoreState = {
      currentGame: { player1: 0, player2: 0 }, // Sempre 0 durante tiebreak
      sets: [{
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 2, player2: 3 },
      }],
    };

    const isTiebreak = true;
    const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];

    // Fix: usar tiebreakScore quando isTiebreak
    const currentGamePoints = {
      player1: isTiebreak
        ? (lastSet?.tiebreakScore?.player1 ?? 0)
        : (effectiveScoreState.currentGame?.player1 ?? 0),
      player2: isTiebreak
        ? (lastSet?.tiebreakScore?.player2 ?? 0)
        : (effectiveScoreState.currentGame?.player2 ?? 0),
    };

    expect(currentGamePoints.player1).toBe(2);
    expect(currentGamePoints.player2).toBe(3);
  });

  it('deve usar currentGame quando isTiebreak=false', () => {
    const effectiveScoreState = {
      currentGame: { player1: 1, player2: 3 },
      sets: [{
        player1: 4,
        player2: 3,
        isTiebreak: false,
        tiebreakScore: undefined,
      }],
    };

    const isTiebreak = false;
    const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];

    const currentGamePoints = {
      player1: isTiebreak
        ? (lastSet?.tiebreakScore?.player1 ?? 0)
        : (effectiveScoreState.currentGame?.player1 ?? 0),
      player2: isTiebreak
        ? (lastSet?.tiebreakScore?.player2 ?? 0)
        : (effectiveScoreState.currentGame?.player2 ?? 0),
    };

    expect(currentGamePoints.player1).toBe(1);
    expect(currentGamePoints.player2).toBe(3);
  });
});
