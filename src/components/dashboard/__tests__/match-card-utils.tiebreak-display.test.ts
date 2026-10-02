import { formatCompactSetScore } from "@/components/dashboard/match-card-utils";

describe("Regression: Tiebreak display on MatchCard", () => {
  it("deve mostrar '7 [7]' para player1 vencedor do tiebreak (e '6 [2]' para player2)", () => {
    const set = {
      player1: 7,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 7, player2: 2 },
    };

    expect(formatCompactSetScore(set, "player1")).toBe("7 [7]");
    expect(formatCompactSetScore(set, "player2")).toBe("6 [2]");
  });

  it("documenta o sintoma visual: se o state do engine vazar games para o set concluído (ex: 8-6), o componente apenas o renderiza fielmente", () => {
    // Sintoma observado anteriormente (causado por falha no isSetComplete):
    // se o scoreState persistido tiver os games errados (8-6), a função 
    // formata o que recebe e mostra "8 [7]".
    // Este teste documenta que a responsabilidade da correção do estado é do ScoringEngine.
    const setBugado = {
      player1: 8,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 7, player2: 2 },
    };
    expect(formatCompactSetScore(setBugado, "player1")).toBe("8 [7]");
    expect(formatCompactSetScore(setBugado, "player2")).toBe("6 [2]");
  });
});
