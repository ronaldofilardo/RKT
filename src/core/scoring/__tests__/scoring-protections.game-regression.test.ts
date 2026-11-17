/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #2 (regressão do game
 * atual): progresso 40-0 → 0-30, progresso normal e deuce/vantagem.
 * Asserções 1:1.
 */
import { getProgress } from './scoringProtectionsTestKit';

describe('PROTEÇÃO #2: Validação de Regressão do Game Atual', () => {
  it("deve detectar regressão no progresso do game atual", () => {
    const oldGame = { player1: 3, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 40-0
    const newGame = { player1: 0, player2: 2, isDeuce: false, advantage: null, secondServe: false }; // 0-30
    const oldProgress = getProgress(oldGame);
    const newProgress = getProgress(newGame);
    expect(newProgress < oldProgress).toBe(true); // Regressão detectada!
  });

  it("deve permitir progresso normal do game", () => {
    const oldGame = { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 15-0
    const newGame = { player1: 2, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 30-0
    const oldProgress = getProgress(oldGame);
    const newProgress = getProgress(newGame);
    expect(newProgress < oldProgress).toBe(false); // Sem regressão
    expect(newProgress > oldProgress).toBe(true); // Progresso válido
  });

  it("deve lidar com estado de deuce e vantagem", () => {
    const deuceGame = { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false };
    const advP1Game = { player1: 3, player2: 3, isDeuce: true, advantage: 'player1', secondServe: false };
    expect(getProgress(deuceGame)).toBe(3);
    expect(getProgress(advP1Game)).toBe(4);
  });
});
