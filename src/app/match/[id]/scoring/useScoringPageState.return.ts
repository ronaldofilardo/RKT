import type { ScoringPageState } from './useScoringPageState';

type Core = Pick<ScoringPageState, 'matchId' | 'router' | 'match' | 'setMatch' | 'isLoading' | 'setIsLoading' | 'error' | 'setError' | 'scoreState' | 'setScoreState' | 'elapsed' | 'setElapsed' | 'timerRef' | 'setupLoading' | 'setSetupLoading' | 'fontScale' | 'setFontScale' | 'pointsHistory' | 'setPointsHistory' | 'showFinishedBanner' | 'setShowFinishedBanner'>;
type Session = Pick<ScoringPageState, 'serveErrorState' | 'handleServeErrorOpen' | 'handleServeErrorClose' | 'handleFirstServeErrorSet' | 'handleFirstServeErrorClear' | 'setServeStep' | 'pointSequenceRef' | 'sessionIdRef' | 'suspendedSession' | 'setSuspendedSession' | 'pendingEditScore' | 'setPendingEditScore' | 'floorCurrentSets' | 'setFloorCurrentSets' | 'viewMode' | 'setViewMode' | 'undoTimestamp' | 'setUndoTimestamp' | 'isProcessingRef' | 'debounceTimerRef' | 'tokenRef' | 'sessionActive' | 'setSessionActive'>;
type Services = Pick<ScoringPageState, 'activeModal' | 'modalParams' | 'open' | 'close' | 'closeAll' | 'session' | 'clearPendingEdit' | 'updateScore' | 'modalParamsRef' | 'openRef' | 'matchIdRef' | 'engineRef' | 'isOnline' | 'enqueue' | 'syncPendingMatches' | 'syncStatus' | 'setSyncStatus' | 'toast'>;
type Derived = Pick<ScoringPageState, 'gamePointToDisplay' | 'timelinePoints' | 'fetchPointLogAudioMeta'>;
export function coreState(value: Core): Core { return value; }
export function sessionState(value: Session): Session { return value; }
export function serviceState(value: Services): Services { return value; }
export function derivedState(value: Derived): Derived { return value; }
