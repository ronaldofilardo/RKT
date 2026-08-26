import type { RallyDetails } from '@/core/scoring/types';
import type { PointFlow } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';

type PointDetailsDeps = {
  match: MatchData | null;
  modalParamsRef: { current: Record<string, string> };
  isProcessingRef: { current: boolean };
  closeAll: () => void;
  processPoint: (flow: PointFlow) => Promise<string | undefined>;
  getServerId: () => string;
  serveStep: 'none' | 'second';
  firstServeError: unknown;
  uploadAudioNote: (matchId: string, pointLogId: string, blob: Blob, durationMs: number, token: string | null) => void;
  token: string | null;
};

function getRallyLength(value: string | undefined, previewBalls: number) {
  return value ? parseInt(value, 10) || previewBalls : previewBalls;
}

function getFlowType(tipo: RallyDetails['tipo']) {
  return tipo === 'winner' ? 'WINNER' : tipo === 'erro_forcado' ? 'FORCED_ERROR' : 'UNFORCED_ERROR';
}

export function createPointDetailsHandler(deps: PointDetailsDeps) {
  return (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => {
    const winnerSide = deps.modalParamsRef.current.winner as 'player1' | 'player2';
    if (!deps.match || !winnerSide || deps.isProcessingRef.current) return;
    const rallyLength = getRallyLength(deps.modalParamsRef.current.rallyLength, details.previewBalls);
    const id = winnerSide === 'player1' ? deps.match.player1.id : deps.match.player2.id;
    deps.closeAll();
    deps.processPoint({
      winnerId: id,
      type: getFlowType(details.tipo),
      serverId: deps.getServerId(),
      isFirstServe: deps.serveStep !== 'second' && !deps.firstServeError,
      isSecondServe: deps.serveStep === 'second' || deps.firstServeError !== null,
      timestamp: Date.now(), rallyDetails: details, rallyLength,
    }).then((pointLogId) => {
      if (audio && pointLogId && deps.match) deps.uploadAudioNote(deps.match.id, pointLogId, audio.blob, audio.durationMs, deps.token);
    });
  };
}
