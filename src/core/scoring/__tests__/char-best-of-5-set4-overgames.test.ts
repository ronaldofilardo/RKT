/**
 * Teste de caracterização (gold/snapshot do comportamento atual).
 * Documenta o bug BEST_OF_5 (Grand Slam) — 4º set permitindo >6 games.
 *
 * Regras esperadas (tênis Grand Slam / BEST_OF_5):
 *  - Set normal: vence em 6 games c/ diff 2, ou 7-5, ou 7-6 via TB.
 *  - 5º set (após 2x2): Match Tiebreak a 10 pts.
 *
 * Bug relatado: o 4º set está permitindo passar de 6 games (ex.: 7-1).
 * Este teste reproduz a sequência real pontos→games→sets para confirmar.
 */
import { ScoringEngine } from "../engine";

const P1 = "p1";
const P2 = "p2";
const config = {
  format: "BEST_OF_5" as const,
  player1Id: P1,
  player2Id: P2,
  initialServerId: P1,
};

function winGame(engine: ScoringEngine, winner: "p1" | "p2") {
  const id = winner === "p1" ? P1 : P2;
  for (let i = 0; i < 4; i++) {
    engine.applyPoint({ winnerId: id, type: "WINNER", serverId: id });
  }
}

function winGames(engine: ScoringEngine, winner: "p1" | "p2", n: number) {
  for (let i = 0; i < n; i++) winGame(engine, winner);
}

describe("BEST_OF_5 — caracterização do bug do 4º set >6 games", () => {
  it("reproduz: 4º set deve fechar em 6-0 (não ir a 7+)", () => {
    const engine = new ScoringEngine(config);

    // Set 1: p1 6-0  (setsWon 1-0)
    winGames(engine, "p1", 6);
    // Set 2: p2 6-0  (setsWon 1-1)
    winGames(engine, "p2", 6);
    // Set 3: p1 6-0  (setsWon 2-1)
    winGames(engine, "p1", 6);
    // Set 4: p2 ganha 6 games -> deveria fechar em 6-0 (setsWon 2-2)
    winGames(engine, "p2", 6);

    // Game "extra" — após 2-2 em sets, o 5º set começa com games normais.
    // O próximo game deve ir pro set 5 como game regular, não pro set 4.
    winGame(engine, "p2");

    const state = engine.getState();

    // === Comportamento Esperado ===
    // O set 4 permanece em 0-6 (não vai a 7+). O 5º set começa com games
    // regulares; MT só será iniciado quando o 5º set chegar a 6-6.
    expect(state.sets.length).toBe(5);
    expect(state.sets[3]).toMatchObject({ player1: 0, player2: 6 });
    expect(state.setsWon).toEqual({ player1: 2, player2: 2 });
    // Set 5 é um set regular (não MT), o game extra foi adicionado como game.
    expect(state.sets[4].player1).toBe(0);
    expect(state.sets[4].player2).toBe(1);
    expect(state.sets[4].isTiebreak).toBe(false);
  });
});
