import { canChangeServerInMatch } from "../singles-server-guard.logic";
import type { ScoringState } from "../types";

function createVirginState(): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
  };
}

describe("canChangeServerInMatch - Regras de Troca de Sacador", () => {
  describe("Duplas (DOUBLES)", () => {
    it("permite troca em duplas mesmo com pontos jogados", () => {
      const state = createVirginState();
      state.currentGame.player1 = 2; // 30-0
      expect(
        canChangeServerInMatch({
          matchType: "DOUBLES",
          scoreState: state,
          pointsHistoryCount: 5,
        })
      ).toBe(true);
    });

    it("permite troca em duplas no 0-0", () => {
      expect(
        canChangeServerInMatch({
          matchType: "DOUBLES",
          scoreState: createVirginState(),
          pointsHistoryCount: 0,
        })
      ).toBe(true);
    });
  });

  describe("Simples (SINGLES)", () => {
    it("permite troca no início absoluto da partida (0-0 sem pontos)", () => {
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: createVirginState(),
          pointsHistoryCount: 0,
        })
      ).toBe(true);
    });

    it("permite troca se scoreState for nulo mas sem pontos", () => {
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: null,
          pointsHistoryCount: 0,
        })
      ).toBe(true);
    });

    it("bloqueia troca se já houver pontos no histórico", () => {
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: createVirginState(),
          pointsHistoryCount: 1,
        })
      ).toBe(false);
    });

    it("bloqueia troca se currentGame tiver pontuação (15-0)", () => {
      const state = createVirginState();
      state.currentGame.player1 = 1;
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });

    it("bloqueia troca se houver segundo saque em andamento (falta no 1º serviço)", () => {
      const state = createVirginState();
      state.currentGame.secondServe = true;
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });

    it("bloqueia troca se houver games ganhos em qualquer set", () => {
      const state = createVirginState();
      state.sets = [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }];
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });

    it("bloqueia troca se houver pontos em tiebreak", () => {
      const state = createVirginState();
      state.sets = [
        {
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 1, player2: 0 },
        },
      ];
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });

    it("bloqueia troca se a partida já estiver finalizada", () => {
      const state = createVirginState();
      state.isFinished = true;
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });

    it("bloqueia troca se flag isSinglesServerLocked for verdadeira", () => {
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: createVirginState(),
          pointsHistoryCount: 0,
          isSinglesServerLocked: true,
        })
      ).toBe(false);
    });

    it("bloqueia troca se singlesServerLocked estiver gravado no scoreState", () => {
      const state = createVirginState() as unknown as Record<string, unknown>;
      state.singlesServerLocked = true;
      expect(
        canChangeServerInMatch({
          matchType: "SINGLES",
          scoreState: state as unknown as ScoringState,
          pointsHistoryCount: 0,
        })
      ).toBe(false);
    });
  });
});

