import { logger } from '@/lib/logger';
import { TIMEOUTS } from '@/lib/constants';
import type { ScoringEngine } from '@/core/scoring/engine';
import type { PointFlow, ScoringState } from '@/core/scoring/types';
import type { MatchData } from './useScoringHandlers.types';
import type { ScoreboardUIState } from '@/hooks/useScoreboardUIState';

type ServerHelpers = {
  getServerId: () => string;
  getWinnerId: (isServer: boolean) => string;
};
type ModalService = {
  createAceRallyDetails: (effect?: string, direction?: string) => PointFlow['rallyDetails'];
  createDoubleFaultRallyDetails: (errorType: 'net' | 'out', effect?: string, direction?: string) => PointFlow['rallyDetails'];
};
type ServeDeps = {
  match: MatchData | null;
  serveErrorState: ScoreboardUIState;
  serverHelpers: ServerHelpers;
  processPoint: (flow: PointFlow) => Promise<unknown>;
  handleFirstServeErrorSet: (error: { errorType: 'out' | 'net'; serveEffect?: string; direction?: string }) => void;
  handleFirstServeErrorClear: () => void;
  handleServeErrorClose: () => void;
  setServeStep: (step: 'none' | 'second') => void;
  closeAll: () => void;
  engineRef: { current: ScoringEngine | null };
  modalService: ModalService;
  debounceTimerRef: { current: ReturnType<typeof setTimeout> | null };
  isProcessingRef: { current: boolean };
  setScoreState: (state: ScoringState | null) => void;
};

export function createServeHandlers(deps: ServeDeps) {
  const processAce = (isSecond: boolean, effect?: string, direction?: string) => {
    const rallyDetails = deps.modalService.createAceRallyDetails(effect, direction);
    deps.processPoint({ winnerId: deps.serverHelpers.getWinnerId(true), type: 'ACE', serverId: deps.serverHelpers.getServerId(), isFirstServe: !isSecond, isSecondServe: isSecond, timestamp: Date.now(), rallyDetails, rallyLength: 1 }).catch((err: unknown) => logger.error('[processAce] Error processing ACE:', err));
    deps.handleFirstServeErrorClear();
    deps.setServeStep('none');
  };

  const handleAceDirect = () => {
    if (!deps.match || deps.isProcessingRef.current) return;
    const isSecond = deps.serveErrorState.serveStep === 'second' || deps.serveErrorState.firstServeError !== null;
    deps.closeAll();
    processAce(isSecond);
  };

  const handleServerEffectConfirm = (effect?: string, direction?: string) => {
    if (!deps.match || deps.isProcessingRef.current) return;
    if (deps.debounceTimerRef.current) clearTimeout(deps.debounceTimerRef.current);
    deps.closeAll();
    const isSecond = deps.serveErrorState.serveStep === 'second' || deps.serveErrorState.firstServeError !== null;
    deps.debounceTimerRef.current = setTimeout(() => {
      processAce(isSecond, effect, direction);
    }, TIMEOUTS.DEBOUNCE_MS);
  };

  const handleServeErrorConfirm = (effect?: string, direction?: string) => {
    const pending = deps.serveErrorState.pendingServeError;
    if (!deps.match || !pending || deps.isProcessingRef.current) return;
    if (deps.debounceTimerRef.current) clearTimeout(deps.debounceTimerRef.current);
    if (pending.serveStep === 'first') {
      if (!deps.engineRef.current) return;
      deps.handleFirstServeErrorSet({ errorType: pending.errorType, serveEffect: effect, direction });
      deps.handleServeErrorClose();
      deps.setServeStep('second');
      deps.closeAll();
      return;
    }
    const rallyDetails = deps.modalService.createDoubleFaultRallyDetails(pending.errorType, effect, direction);
    const firstFaultDetail = deps.serveErrorState.firstServeError ? { errorType: deps.serveErrorState.firstServeError.errorType, serveEffect: deps.serveErrorState.firstServeError.serveEffect, direction: deps.serveErrorState.firstServeError.direction } : undefined;
    deps.closeAll();
    deps.debounceTimerRef.current = setTimeout(() => {
      deps.processPoint({ winnerId: deps.serverHelpers.getWinnerId(false), type: 'DOUBLE_FAULT', serverId: deps.serverHelpers.getServerId(), timestamp: Date.now(), rallyDetails, rallyLength: 1, isFirstServe: false, isSecondServe: true, firstFaultDetail });
      deps.handleFirstServeErrorClear();
      deps.handleServeErrorClose();
      deps.setServeStep('none');
    }, 50);
  };

  const handleServeCancel = () => {
    deps.handleServeErrorClose();
    if (deps.serveErrorState.firstServeError && deps.engineRef.current) {
      deps.engineRef.current.undoLastPoint();
      deps.setScoreState(deps.engineRef.current.getState());
    }
    deps.handleFirstServeErrorClear();
  };

  const handleServeErrorCancel = () => {
    deps.closeAll();
    deps.handleServeErrorClose();
    if (deps.serveErrorState.serveStep !== 'second') {
      if (deps.serveErrorState.firstServeError && deps.engineRef.current) {
        deps.engineRef.current.undoLastPoint();
        deps.setScoreState(deps.engineRef.current.getState());
      }
      deps.handleFirstServeErrorClear();
      deps.setServeStep('none');
    }
  };

  return { handleServerEffectConfirm, handleAceDirect, handleServeErrorConfirm, handleServeCancel, handleServeErrorCancel };
}
