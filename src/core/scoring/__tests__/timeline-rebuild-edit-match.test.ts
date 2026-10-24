import { doesEditPrecedePointLog } from "../timeline-rebuild-edit-match.logic";
import type { TimelineScoreEdit } from "../timeline-rebuild-simulate.logic";
import type { PointLogRow } from "../point-log-merge";

describe("doesEditPrecedePointLog (PR-7)", () => {
  it("posiciona por sequenceNumber mesmo se timestamp do aparelho estiver atrasado", () => {
    const edit: TimelineScoreEdit = {
      editedAt: new Date("2026-01-01T10:00:00Z"), // relógio do celular atrasado
      newScoreState: {
        pointLogSequenceAtEdit: 5,
        state: { sets: [] },
      },
    };

    const pointLogBefore: PointLogRow = {
      id: "log-4",
      matchId: "m1",
      sequenceNumber: 4,
      timestamp: new Date("2026-01-01T12:00:00Z"), // timestamp à frente
      pointData: null,
      server: "player1",
      receiver: "player2",
      scoreState: null,
      pointNumber: 4,
      pointOutcome: "ACE",
    };

    const pointLogAfter: PointLogRow = {
      id: "log-6",
      matchId: "m1",
      sequenceNumber: 6,
      timestamp: new Date("2026-01-01T12:01:00Z"),
      pointData: null,
      server: "player1",
      receiver: "player2",
      scoreState: null,
      pointNumber: 6,
      pointOutcome: "WINNER",
    };

    // A edição foi após seq 5, logo NÃO precede o log de seq 4
    expect(doesEditPrecedePointLog(edit, pointLogBefore)).toBe(false);
    // Mas PRECEDERÁ o log de seq 6 (primeiro ponto após seq 5)
    expect(doesEditPrecedePointLog(edit, pointLogAfter)).toBe(true);
  });

  it("utiliza fallback por editedAt quando pointLogSequenceAtEdit não existir (edição antiga)", () => {
    const edit: TimelineScoreEdit = {
      editedAt: new Date("2026-01-01T10:05:00Z"),
      newScoreState: {
        state: { sets: [] },
      },
    };

    const pointLog1: PointLogRow = {
      id: "log-1",
      matchId: "m1",
      sequenceNumber: 1,
      timestamp: new Date("2026-01-01T10:00:00Z"),
      pointData: null,
      server: "player1",
      receiver: "player2",
      scoreState: null,
      pointNumber: 1,
      pointOutcome: "ACE",
    };

    const pointLog2: PointLogRow = {
      id: "log-2",
      matchId: "m1",
      sequenceNumber: 2,
      timestamp: new Date("2026-01-01T10:10:00Z"),
      pointData: null,
      server: "player1",
      receiver: "player2",
      scoreState: null,
      pointNumber: 2,
      pointOutcome: "WINNER",
    };

    expect(doesEditPrecedePointLog(edit, pointLog1)).toBe(false);
    expect(doesEditPrecedePointLog(edit, pointLog2)).toBe(true);
  });
});
