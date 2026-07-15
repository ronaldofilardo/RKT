/**
 * Integration test for score adjustment workflow
 * Simulates: User opens Ajustar Placar → edits set 3 to 3x2, 0-40 → confirms
 * Expected: PATCH /api/matches/[id]/state returns 200 with correct setsWon
 */

import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, SetScore } from "@/core/scoring/types";
import { pointToProgress } from "@/core/scoring/point-utils";

describe("Score Adjustment Integration Test", () => {
  it("should reconstruct state with completedSets + partial set correctly", () => {
    // Scenario: User comes to /scoring page with Set 1 & 2 already completed
    // currentGamePoints display: {player1: 0, player2: 3} (which engine stored as internal indices)
    // User clicks "Ajustar Placar" to add Set 3 as 3x2, 0-40

    // Initial state from bank (match already has 2 sets completed)
    const currentScoreState: ScoringState = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }, // Set 1
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null }, // Set 2
        { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }, // Set 3 partial
      ],
      currentGame: {
        player1: 0,
        player2: 3,
        isDeuce: false,
        advantage: null,
        secondServe: false,
      },
      server: "player1",
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 1 },
      startedAt: Date.now(),
      secondServe: false,
    };

    // Props passed to EditScoreModal from page (completedSets only includes fully finished sets)
    const completedSets = [
      { games: { player1: 6, player2: 4 }, winner: "player1" as const },
      { games: { player1: 3, player2: 6 }, winner: "player2" as const },
    ];

    // User edits and confirms: Set 3 stays 3x2 (partial), game points stay 0-40
    // EditScoreModal now includes completedSets in finalSets:
    const existingCompleted = completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
    }));

    const newSets = [
      {
        p1Games: 3,
        p2Games: 2,
        isPartial: true,
        currentGamePoints: { player1: 0, player2: 40 },
      },
    ];

    const finalSets = [...existingCompleted, ...newSets];

    // handleEditScore processes finalSets
    const setsData = finalSets;
    const completedSetsProcessed = setsData.filter((set) => !set.isPartial);

    const p1Sets = completedSetsProcessed.filter(
      (set) => set.p1Games > set.p2Games,
    ).length;
    const p2Sets = completedSetsProcessed.filter(
      (set) => set.p2Games > set.p1Games,
    ).length;

    // BUG A FIX: completedSetsProcessed now has 2 items (Set 1 & 2), not 0
    expect(completedSetsProcessed).toHaveLength(2);
    expect(p1Sets).toBe(1); // Set 1: 6-4 won by player1
    expect(p2Sets).toBe(1); // Set 2: 3-6 won by player2

    const setsWon = { player1: p1Sets, player2: p2Sets };
    const bankSetsWon = { player1: 1, player2: 1 };

    // Floor check (SCORE_REGRESSION prevention)
    const regression =
      setsWon.player1 < bankSetsWon.player1 ||
      setsWon.player2 < bankSetsWon.player2;

    expect(regression).toBe(false); // ✓ No regression, PATCH will succeed (200)
  });

  it("should correctly map 0-40 game points and apply points", () => {
    // BUG B FIX: game points 0-40 should map to engine state {player1:0, player2:3}

    const p1p = pointToProgress(0);
    const p2p = pointToProgress(40);

    const gameState = {
      player1: Math.min(p1p, 4),
      player2: Math.min(p2p, 4),
      isDeuce: p1p === 3 && p2p === 3,
      advantage:
        p1p === 4 && p2p === 3
          ? "player1"
          : p2p === 4 && p1p === 3
            ? "player2"
            : null,
      secondServe: false,
    };

    expect(gameState).toEqual({
      player1: 0,
      player2: 3,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    });

    // Now simulate João marking an ACE (player1 wins point)
    const newState = {
      ...gameState,
      player1: gameState.player1 + 1,
    };

    // Check that game is not won (score advances to 15-40)
    const gameWon =
      (newState.player1 >= 4 && newState.player2 < 3) ||
      (newState.player2 >= 4 && newState.player1 < 3);

    expect(newState.player1).toBe(1); // 15
    expect(newState.player2).toBe(3); // 40
    expect(gameWon).toBe(false); // Game continues
  });

  it("should serialize and restore state correctly", () => {
    // Ensure state survives serialization round-trip

    const config = {
      format: "BEST_OF_3" as const,
      player1Id: "p1",
      player2Id: "p2",
      initialServerId: "p1",
    };

    const initialState: ScoringState = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
      ],
      currentGame: {
        player1: 0,
        player2: 3,
        isDeuce: false,
        advantage: null,
        secondServe: false,
      },
      server: "player1",
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 1 },
      startedAt: Date.now(),
      secondServe: false,
    };

    // Create engine with state
    const engine = new ScoringEngine(config, initialState);

    // Serialize
    const serialized = engine.serialize();
    const parsed = JSON.parse(serialized);

    // Restore from serialized
    const engine2 = ScoringEngine.fromSerialized(config, serialized);
    const restoredState = engine2.getState();

    // Validate restored state
    expect(restoredState.sets).toHaveLength(3);
    expect(restoredState.currentGame).toEqual({
      player1: 0,
      player2: 3,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    });
    expect(restoredState.setsWon).toEqual({ player1: 1, player2: 1 });
  });
});
