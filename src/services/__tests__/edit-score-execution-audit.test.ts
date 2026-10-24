import { buildTransitionUpdateData } from "../match-service-operations.logic";
import { buildNewScoringState } from "@/hooks/useSessionManager.state-builder";
import { resolveInitialServerSide } from "@/lib/resolveInitialServerSide";
import { doesEditPrecedePointLog } from "@/core/scoring/timeline-rebuild-edit-match.logic";
import { validateScoreProgression } from "../match-validator-progression.logic";
import { applyFullSetSubmission } from "@/components/scoring/use-edit-score-modal-submission-apply.logic";

describe("Auditoria de Execução — Suíte de Validação (PR-0 a PR-11)", () => {
  describe("Fase 2: startedAt preservado", () => {
    it("não altera startedAt se existingMatch já possui startedAt definido", () => {
      const fixedDate = new Date("2026-05-01T10:00:00Z");
      const existingMatch = {
        player1Id: "p1",
        player2Id: "p2",
        scoreState: null,
        startedAt: fixedDate,
      };

      const updateData = buildTransitionUpdateData("IN_PROGRESS", undefined, null, existingMatch);
      expect(updateData.startedAt).toBeUndefined();
      expect(updateData.finishedAt).toBeNull();
      expect(updateData.winnerId).toBeNull();
    });

    it("define startedAt apenas na primeira transição se for nulo", () => {
      const existingMatch = {
        player1Id: "p1",
        player2Id: "p2",
        scoreState: null,
        startedAt: null,
      };

      const updateData = buildTransitionUpdateData("IN_PROGRESS", undefined, null, existingMatch);
      expect(updateData.startedAt).toBeInstanceOf(Date);
    });

    it("buildNewScoringState preserva startedAt do engine", () => {
      const customStartedAt = 1714557600000;
      const state = buildNewScoringState({
        setResults: [{ p1Games: 6, p2Games: 3, isPartial: false }],
        server: "player1",
        format: "BEST_OF_3",
        startedAt: customStartedAt,
      });
      expect(state.startedAt).toBe(customStartedAt);
    });
  });

  describe("Fase 8: Duplas - Sacador Inicial", () => {
    it("resolve sacador pertencente à dupla 2 quando initialServerId for player2PartnerId", () => {
      const match = {
        player1Id: "p1",
        player2Id: "p2",
        player1PartnerId: "p1_partner",
        player2PartnerId: "p2_partner",
        initialServerId: "p2_partner",
      };
      expect(resolveInitialServerSide(match)).toBe("player2");
    });
  });

  describe("Fase 7: /report por sequência", () => {
    it("posiciona a edição pelo pointLogSequenceAtEdit", () => {
      const edit = {
        editedAt: new Date("2026-01-01T08:00:00Z"), // relógio antigo
        newScoreState: { pointLogSequenceAtEdit: 10 },
      };
      const log9 = {
        id: "l9",
        matchId: "m1",
        sequenceNumber: 9,
        timestamp: new Date("2026-01-01T12:00:00Z"),
        pointData: null,
        server: "player1",
        receiver: "player2",
        scoreState: null,
        pointNumber: 9,
        pointOutcome: "ACE" as const,
      };
      const log11 = {
        id: "l11",
        matchId: "m1",
        sequenceNumber: 11,
        timestamp: new Date("2026-01-01T12:01:00Z"),
        pointData: null,
        server: "player1",
        receiver: "player2",
        scoreState: null,
        pointNumber: 11,
        pointOutcome: "WINNER" as const,
      };

      expect(doesEditPrecedePointLog(edit, log9)).toBe(false);
      expect(doesEditPrecedePointLog(edit, log11)).toBe(true);
    });
  });

  describe("Fase 3: Regressão de sets permitida em manual score edit", () => {
    it("permite redução de sets quando isManualScoreEdit === true", () => {
      const oldState = { setsWon: { player1: 2, player2: 0 }, sets: [] };
      const newState = { setsWon: { player1: 1, player2: 1 }, sets: [] };

      const validation = validateScoreProgression(oldState, newState, true, true);
      expect(validation).toBeNull();
    });
  });

  describe("Fase 1: Falha de persistência não avança modal", () => {
    it("não altera estado nem finaliza partida quando onConfirm retorna ok: false", async () => {
      const mockSetState = jest.fn();
      const mockOnMatchFinished = jest.fn();
      const mockSetConfirmError = jest.fn();

      const onConfirm = jest.fn().mockResolvedValue({ ok: false, reason: "busy" });

      const submission = {
        setData: { p1Games: 6, p2Games: 2, isPartial: false },
        allSets: [{ p1Games: 6, p2Games: 2, isPartial: false }],
        nextServer: "player2" as const,
      };

      await applyFullSetSubmission({
        submission: submission as any,
        validation: { isValid: true, isComplete: true, winner: "player1" },
        matchWouldEnd: true,
        isSetTrulyCompleted: true,
        p1Val: 6,
        p2Val: 2,
        onConfirm,
        onMatchFinished: mockOnMatchFinished,
        setState: mockSetState,
        setConfirmError: mockSetConfirmError,
        inputTouchedRef: { current: { p1: true, p2: true } },
      });

      expect(onConfirm).toHaveBeenCalled();
      expect(mockOnMatchFinished).not.toHaveBeenCalled();
      expect(mockSetState).not.toHaveBeenCalled();
      expect(mockSetConfirmError).toHaveBeenCalledWith("Uma operação de sincronização já está em andamento. Aguarde um instante.");
    });
  });
});
