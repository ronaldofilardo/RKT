/**
 * Regressão — formato SHORT_SET_2V2_NO_AD ("Sets Curtos 2/2")
 *
 * Regra oficial:
 *  - Sets 1 e 2 COMEÇAM em 2-2 e TERMINAM em 6 (por 2 de diferença); em 6-6
 *    há tiebreak de 7 pontos (set 7-6).
 *  - O 3º set (quando 1x1) é um Match Tiebreak de 10 pontos.
 *  - Sem vantagem (ponto decisivo em 40-40).
 *
 * Bugs cobertos (2026-10-09):
 *  1. regra legada de "4 games / tiebreak em 3-3" (removida);
 *  2. placeholder 2-2 empilhado como set fantasma ([2-2, 4-2, 4-2]);
 *  3. último game preso no placar da partida finalizada (40-15);
 *  4. timeline (/report) sem o placar inicial 2x2 nos games do set.
 */
import { ScoringEngine } from '../engine';
import { createInitialState } from '../engine.state';
import { normalizeScoreState } from '../score-normalizer';
import { rebuildTimelineFromPointLogs, type PointLogRow } from '../timeline-rebuild';
import type { PointFlow, ScoringState } from '../types';

const P1 = 'player-1-id';
const P2 = 'player-2-id';
const FORMAT = 'SHORT_SET_2V2_NO_AD' as const;

const config = { format: FORMAT, player1Id: P1, player2Id: P2, initialServerId: P1 };

// Mesmo formato do scoreState criado em matchService (buildCreateDefaults).
function seededState(): ScoringState {
  return {
    sets: [{ player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
}

function point(engine: ScoringEngine, winnerId: string) {
  const serverId = engine.getState().server === 'player1' ? P1 : P2;
  return engine.applyPoint({ winnerId, type: 'WINNER', serverId } as PointFlow);
}

function winGame(engine: ScoringEngine, winnerId: string) {
  for (let i = 0; i < 4; i++) {
    if (engine.getState().isFinished) return;
    point(engine, winnerId);
  }
}

function winGames(engine: ScoringEngine, winnerId: string, count: number) {
  for (let i = 0; i < count; i++) winGame(engine, winnerId);
}

// Do 2-2 até 6-6 alternando os games (4 games para cada lado).
function playUntilSixAll(engine: ScoringEngine) {
  for (let i = 0; i < 4; i++) {
    winGame(engine, P1);
    winGame(engine, P2);
  }
}

describe.each([
  ['engine criado do zero', () => new ScoringEngine(config)],
  ['engine restaurado do scoreState salvo no banco (2-2 inicial)', () => new ScoringEngine(config, seededState())],
])('SHORT_SET_2V2_NO_AD — %s', (_label, makeEngine) => {
  it('começa com o set 1 em 2-2', () => {
    const state = makeEngine().getState();
    expect(state.sets).toEqual([{ player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null }]);
  });

  it('o primeiro game substitui o 2-2 inicial (sem set fantasma)', () => {
    const engine = makeEngine();
    winGame(engine, P1);

    const { sets } = engine.getState();
    expect(sets).toHaveLength(1);
    expect(sets[0].player1).toBe(3);
    expect(sets[0].player2).toBe(2);
  });

  it('NÃO fecha o set em 4-2 nem em 5-2 (regra de 4 games removida) e fecha em 6-2', () => {
    const engine = makeEngine();

    winGames(engine, P1, 2); // 4-2
    expect(engine.getState().setsWon).toEqual({ player1: 0, player2: 0 });
    expect(engine.getState().sets).toHaveLength(1);

    winGame(engine, P1); // 5-2
    expect(engine.getState().setsWon).toEqual({ player1: 0, player2: 0 });

    winGame(engine, P1); // 6-2
    const state = engine.getState();
    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    expect(state.sets[0]).toMatchObject({ player1: 6, player2: 2 });
  });

  it('o set seguinte já nasce em 2-2 e o número de sets acompanha o placar', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4); // set 1: 6-2

    const state = engine.getState();
    expect(state.sets).toHaveLength(2);
    expect(state.sets[1]).toMatchObject({ player1: 2, player2: 2, isTiebreak: false });

    winGame(engine, P2); // 2-3 no set 2
    expect(engine.getState().sets).toHaveLength(2);
    expect(engine.getState().sets[1]).toMatchObject({ player1: 2, player2: 3 });
  });

  it('vitória 2x0 em sets encerra a partida só com os 2 sets jogados e sem game residual', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4); // set 1: 6-2
    winGames(engine, P1, 4); // set 2: 6-2

    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 2, player2: 0 });
    expect(state.sets).toHaveLength(2);
    expect(state.sets.map((s) => [s.player1, s.player2])).toEqual([
      [6, 2],
      [6, 2],
    ]);
    expect(state.currentGame).toMatchObject({ player1: 0, player2: 0, isDeuce: false, advantage: null });
  });

  it('não deixa o último game "preso" ao finalizar (ex.: 40-15 após o fim do jogo)', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4);
    winGames(engine, P1, 3); // set 2: 5-2
    // 3 pontos no game decisivo (40-0) e o 4º fecha a partida
    for (let i = 0; i < 3; i++) point(engine, P1);
    expect(engine.getState().currentGame.player1).toBe(3);
    point(engine, P1);

    const state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.currentGame).toMatchObject({ player1: 0, player2: 0 });
  });

  it('6-5 não fecha o set; 7-5 fecha', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4); // set 1: 6-2
    // set 2: 2-2 → 5-5
    for (let i = 0; i < 3; i++) {
      winGame(engine, P1);
      winGame(engine, P2);
    }
    expect(engine.getState().sets[1]).toMatchObject({ player1: 5, player2: 5 });

    winGame(engine, P1); // 6-5
    expect(engine.getState().setsWon).toEqual({ player1: 1, player2: 0 });
    expect(engine.getState().isFinished).toBe(false);

    winGame(engine, P1); // 7-5
    expect(engine.getState().isFinished).toBe(true);
    expect(engine.getState().sets[1]).toMatchObject({ player1: 7, player2: 5 });
  });

  it('só inicia tiebreak em 6-6 (nunca em 3-3 ou 4-4)', () => {
    const engine = makeEngine();

    winGame(engine, P1);
    winGame(engine, P2); // 3-3
    expect(engine.getState().sets[0]).toMatchObject({ player1: 3, player2: 3, isTiebreak: false });

    winGame(engine, P1);
    winGame(engine, P2); // 4-4
    expect(engine.getState().sets[0]).toMatchObject({ player1: 4, player2: 4, isTiebreak: false });
  });

  it('o tiebreak do set em 6-6 vai a 7 pontos e fecha o set em 7-6', () => {
    const engine = makeEngine();
    playUntilSixAll(engine);

    expect(engine.getState().sets[0]).toMatchObject({
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 0, player2: 0 },
    });

    for (let i = 0; i < 6; i++) point(engine, P1);
    expect(engine.getState().setsWon).toEqual({ player1: 0, player2: 0 });

    point(engine, P1); // 7-0
    const state = engine.getState();
    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
    expect(state.sets[0]).toMatchObject({ player1: 7, player2: 6, tiebreakScore: { player1: 7, player2: 0 } });
    expect(state.sets).toHaveLength(2);
    expect(state.sets[1]).toMatchObject({ player1: 2, player2: 2 });
  });

  it('tiebreak do SET 2 fecha em 7 pontos (e não é confundido com o Match Tiebreak de 10)', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4); // set 1: 6-2
    playUntilSixAll(engine); // set 2: 6-6

    for (let i = 0; i < 7; i++) point(engine, P2);

    const state = engine.getState();
    expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
    expect(state.sets[1]).toMatchObject({ player1: 6, player2: 7, tiebreakScore: { player1: 0, player2: 7 } });
  });

  it('com 1x1 o 3º set é um Match Tiebreak de 10 pontos', () => {
    const engine = makeEngine();
    winGames(engine, P1, 4); // set 1: 6-2 (P1)
    winGames(engine, P2, 4); // set 2: 2-6 (P2)

    let state = engine.getState();
    expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
    expect(state.sets).toHaveLength(3);
    expect(state.sets[2]).toMatchObject({ isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });

    for (let i = 0; i < 9; i++) point(engine, P1);
    expect(engine.getState().isFinished).toBe(false); // 9-0 ainda não fecha

    point(engine, P1); // 10-0
    state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
    expect(state.sets).toHaveLength(3);
  });
});

describe('createInitialState', () => {
  it('semeia o set 1 em 2-2 para SHORT_SET_2V2_NO_AD', () => {
    expect(createInitialState(config).sets).toEqual([
      { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
    ]);
  });

  it('mantém sets vazios nos demais formatos', () => {
    expect(createInitialState({ ...config, format: 'BEST_OF_3' }).sets).toEqual([]);
    expect(createInitialState({ ...config, format: 'BEST_OF_3_NO_AD' }).sets).toEqual([]);
  });
});

describe('normalizeScoreState — legado do set fantasma 2-2', () => {
  // Fábrica: normalizeScoreState atribui o resultado de volta ao objeto recebido,
  // então cada teste precisa da sua própria cópia.
  const makeLegacy = () => ({
    sets: [
      { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 2, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 2, isTiebreak: false, tiebreakScore: null },
    ],
    setsWon: { player1: 2, player2: 0 },
    isFinished: true,
  });

  it('descarta o 2-2 inicial que ficou empilhado antes dos sets reais', () => {
    const result = normalizeScoreState(makeLegacy(), FORMAT);
    expect(result?.sets).toHaveLength(2);
    expect(result?.sets[0]).toMatchObject({ player1: 4, player2: 2 });
  });

  it('não mexe no 2-2 quando ele é o único set (set 1 ainda não jogado)', () => {
    const result = normalizeScoreState(
      { sets: [{ player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null }], setsWon: { player1: 0, player2: 0 } },
      FORMAT,
    );
    expect(result?.sets).toHaveLength(1);
  });

  it('não mexe em outros formatos', () => {
    const result = normalizeScoreState(makeLegacy(), 'BEST_OF_3');
    expect(result?.sets).toHaveLength(3);
  });
});

describe('timeline (/report) — Sets Curtos 2/2', () => {
  let seq = 0;
  function log(winnerId: string): PointLogRow {
    seq += 1;
    return {
      id: `log-${seq}`,
      winnerId,
      type: 'WINNER',
      serverId: P1,
      timestamp: new Date(Date.UTC(2026, 9, 9, 10, 0, 0, seq)),
      sequenceNumber: seq,
      clientEventId: `evt-${seq}`,
      annotations: { rallyLength: 3, isFirstServe: true, isSecondServe: false, rallyDetails: null },
      hasAudioNote: false,
      audioNoteDuration: null,
    } as PointLogRow;
  }

  it('mostra o placar de games a partir de 2x2 e numera os sets corretamente', () => {
    seq = 0;
    // set 1: P1 vence 4 games seguidos (16 pontos) + 1º ponto do set 2
    const logs: PointLogRow[] = [];
    for (let i = 0; i < 17; i++) logs.push(log(P1));

    const timeline = rebuildTimelineFromPointLogs([], logs, P1, P2, P1, FORMAT);

    expect(timeline).toHaveLength(17);

    // 1º ponto da partida: set 1, games 2x2
    expect(timeline[0].setNumber).toBe(1);
    expect(timeline[0].gamesScore).toEqual({ player1: 2, player2: 2 });

    // último ponto do set 1: games 5x2, ainda set 1
    expect(timeline[15].setNumber).toBe(1);
    expect(timeline[15].gamesScore).toEqual({ player1: 5, player2: 2 });

    // 1º ponto do set 2: games 2x2 e set 2 (sem deslocar a numeração)
    expect(timeline[16].setNumber).toBe(2);
    expect(timeline[16].gamesScore).toEqual({ player1: 2, player2: 2 });
  });
});
