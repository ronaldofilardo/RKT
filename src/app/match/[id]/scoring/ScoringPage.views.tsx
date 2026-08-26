import type { TennisFormat } from '@/core/scoring/types';
import { MatchHeader } from '@/components/scoring/MatchHeader';
import { PlayerCard } from '@/components/scoring/PlayerCard';
import { ContextBadges } from '@/components/scoring/ContextBadges';
import { ScoreboardCard } from '@/components/scoring/ScoreboardCard';
import { ActionBar } from '@/components/scoring/ActionBar';
import { SetupModal } from '@/components/scoring/SetupModal';
import { UndoConfirmModal } from '@/components/scoring/UndoConfirmModal';
import { PointDetailsModal } from '@/components/scoring/PointDetailsModal';
import { ServerEffectModal } from '@/components/scoring/ServerEffectModal';
import { EditScoreModal } from '@/components/scoring/EditScoreModal';
import { MatchTimelineView } from '@/components/scoring/MatchTimelineView';
import CourtBackground from '@/components/scoring/CourtBackground';
import { AnnotationSessionPanel } from '@/components/scoring/AnnotationSessionPanel';
import type { useScoringPageState } from './useScoringPageState';
import type { useScoringPageEffects } from './useScoringPageEffects';
import type { useScoringPageDerived } from './useScoringPageDerived';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type ScoringStateData = ReturnType<typeof useScoringPageState>;
type ScoringHandlersData = ReturnType<typeof useScoringPageEffects>;
type ScoringDerivedData = ReturnType<typeof useScoringPageDerived>;
type ViewActions = Pick<ScoringHandlersData, 'handleSetupConfirm' | 'handleUndo' | 'handleEditScore' | 'handleEditScoreCancel' | 'handleEditScoreRefreshFloor'>;
type ScoringViewData = { matchId: string; router: AppRouterInstance; state: ScoringStateData; handlers: ScoringHandlersData; derived: ScoringDerivedData; match: NonNullable<ScoringStateData['match']> };
type TimelineViewData = ScoringViewData & { elapsed: number; fontScale: number; timelinePoints: ScoringDerivedData['timelinePoints']; isFinished: boolean; abandonCurrentSession: ScoringHandlersData['abandonCurrentSession']; setViewMode: ScoringStateData['setViewMode'] };
type EnrichedViewData = ScoringViewData & ScoringDerivedData;
type ModalViewData = EnrichedViewData & ViewActions;

export function TimelineScreen({ data }: { data: TimelineViewData }) {
  const { match, matchId, elapsed, abandonCurrentSession, router, setViewMode, timelinePoints, isFinished, fontScale } = data;
  return <div className="min-h-screen bg-gray-900 flex flex-col" style={{ fontSize: `${fontScale * 100}%` }}><MatchHeader elapsedSeconds={elapsed} onClose={async () => { await abandonCurrentSession(); router.push('/dashboard'); }} onTimeline={() => setViewMode('scoring')} isFinished={isFinished} /><div className="flex-1 flex flex-col px-4 py-3"><div className="flex items-center justify-between mb-3"><button onClick={() => setViewMode('scoring')} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm">← Placar</button><span className="text-xs text-gray-400">{timelinePoints.length} pontos</span><button onClick={() => router.push(`/match/${matchId}/report`)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg text-sm">Relatório →</button></div><div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-4 overflow-hidden"><MatchTimelineView points={timelinePoints} player1Name={match.player1.name} player2Name={match.player2.name} matchId={matchId} /></div></div></div>;
}

function FinishedBannerScore({ data }: { data: EnrichedViewData }) {
  const scoreState = data.derived.effectiveScoreState ?? data.state.scoreState;
  return <p className="text-[11px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1">{scoreState?.setsWon.player1 ?? 0} x {scoreState?.setsWon.player2 ?? 0} sets</p>;
}

function FinishedBannerActions({ data }: { data: EnrichedViewData }) {
  const { matchId, router } = data;
  const { abandonCurrentSession } = data.handlers;
  const register = async () => { await abandonCurrentSession(); router.push('/dashboard'); };
  return <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4 justify-center"><button onClick={() => router.push(`/match/${matchId}/report`)} className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl text-[11px] sm:text-sm min-h-[44px]">📊 Relatório</button><button onClick={register} className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[11px] sm:text-sm border border-white/20 min-h-[44px]">✅ Registrar</button></div>;
}

export function FinishedBanner({ data }: { data: EnrichedViewData }) {
  if (!data.isFinished) return null;
  const winnerName = data.winner === 'player1' ? data.match.player1.name : data.match.player2.name;
  return <div className="mt-2 sm:mt-3 bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-3 sm:p-5 text-center relative z-10 mx-0"><span className="text-2xl sm:text-4xl">🏆</span><h2 className="text-base sm:text-xl font-black text-white mt-1 sm:mt-2">PARTIDA FINALIZADA!</h2><p className="text-sm sm:text-lg font-bold text-yellow-300 mt-0.5 sm:mt-1">VENCEDOR: {winnerName}</p><FinishedBannerScore data={data} /><FinishedBannerActions data={data} /></div>;
}

export function ScoringScreen({ data }: { data: ScoringViewData }) {
  const { match, state, handlers, derived, matchId, router } = data;
  const { effectiveScoreState, p1IsServing, p2IsServing, isMatchPoint, isSetPoint, isBreakPoint, isTiebreak, isSuperTiebreak, isFinished, winner, canUndo, canRedo, isProcessingPoint } = derived;
  const { elapsed, fontScale, pointsHistory, suspendedSession, sessionIdRef, sessionActive, setViewMode, setFontScale } = state;
  const { abandonCurrentSession, openAceModal, handleAceDirect, handleServeErrorWithModal, handleCancelSecondServe, handleServeCancel, handleRedo, handlePointFromCard, handleEditScore, handleEditScoreCancel, handleEditScoreRefreshFloor, handleSetupConfirm, handleUndo } = handlers;
  return <div className="min-h-screen bg-gray-900 flex flex-col" style={{ fontSize: `${fontScale * 100}%` }}>{state.syncStatus !== 'synced' && <SyncBanner syncStatus={state.syncStatus} />}<MatchHeader elapsedSeconds={elapsed} onClose={async () => { await abandonCurrentSession(); router.push('/dashboard'); }} onTimeline={() => setViewMode('timeline')} isFinished={isFinished} /><div className="flex-1 flex flex-col gap-0 sm:gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-hidden"><div className="absolute inset-0 opacity-20 pointer-events-none"><CourtBackground courtType={match.courtType} /></div><div className="my-2 sm:my-3"><ScoreboardCard player1={match.player1} player2={match.player2} scoreState={effectiveScoreState} isSuspended={!!suspendedSession} format={match.format as string} /></div><div className="flex items-center gap-1 sm:gap-2 flex-1 relative z-10 min-h-0"><PlayerCard player={match.player1} side="player1" scoreState={effectiveScoreState} isServing={p1IsServing} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint} isWinner={winner === 'player1'} onPoint={() => handlePointFromCard('player1')} onSwipeDown={() => state.open('undo')} disabled={isFinished} /><div className="w-px h-full bg-white/10 flex-shrink-0" /><PlayerCard player={match.player2} side="player2" scoreState={effectiveScoreState} isServing={p2IsServing} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint} isWinner={winner === 'player2'} onPoint={() => handlePointFromCard('player2')} onSwipeDown={() => state.open('undo')} disabled={isFinished} /></div><ContextBadges isMatchPoint={isMatchPoint} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint} isTiebreak={isTiebreak} isSuperTiebreak={isSuperTiebreak} pointsHistory={pointsHistory} /><FinishedBanner data={{ ...data, ...derived }} /></div><ActionBar secondServe={false} serveStep={state.serveErrorState.serveStep} canUndo={canUndo} canRedo={canRedo} canEdit={!isFinished} fontScale={fontScale} isFinished={isFinished} isProcessing={isProcessingPoint} onAceDirect={handleAceDirect} onAceWithDetails={openAceModal} onOut={(step) => handleServeErrorWithModal('out', step)} onNet={(step) => handleServeErrorWithModal('net', step)} onCancelSecondServe={handleCancelSecondServe} onServeCancel={handleServeCancel} onUndo={() => state.open('undo')} onRedo={() => handleRedo()} onFontSmaller={() => setFontScale((f: number) => Math.max(0.6, f - 0.1))} onFontBigger={() => setFontScale((f: number) => Math.min(2, f + 0.1))} onEditScore={() => state.open('edit-score')} />{sessionIdRef.current && <AnnotationSessionPanel sessionId={sessionIdRef.current} matchId={matchId} isActive={sessionActive} onStart={() => state.setSessionActive(true)} onPause={() => state.setSessionActive(false)} onEnd={async () => { await abandonCurrentSession(); state.setSessionActive(false); }} annotatorCount={1} />}<ModalStack data={{ ...data, ...derived, handleSetupConfirm, handleUndo, handleEditScore, handleEditScoreCancel, handleEditScoreRefreshFloor }} /></div>;
}

function SyncBanner({ syncStatus }: { syncStatus: string }) { if (syncStatus === 'synced') return null; const offline = syncStatus === 'offline'; return <div data-testid="sync-status" data-sync-state={syncStatus} role="status" aria-live="polite" className={`text-white text-center text-sm py-1 px-4 font-semibold ${offline ? 'bg-amber-600' : 'bg-blue-600'}`}>{offline ? '🔴 Modo Offline — sincronizando ao reconectar' : '🔄 Sincronizando pontos pendentes...'}</div>; }

function SetupModalView({ data }: { data: ModalViewData }) {
  const { match, state, handleSetupConfirm } = data;
  if (match.initialServerId) return null;
  return <SetupModal player1={match.player1} player2={match.player2} onSelectServer={handleSetupConfirm} loading={state.setupLoading} />;
}

function UndoModalView({ data }: { data: ModalViewData }) {
  const { state, handleUndo } = data;
  return <UndoConfirmModal onConfirm={handleUndo} onCancel={state.close} loading={false} />;
}

function EditScoreModalView({ data }: { data: ModalViewData }) {
  const { state, match, derived, handleEditScore, handleEditScoreCancel, handleEditScoreRefreshFloor } = data;
  if (!derived.effectiveScoreState) return null;
  const score = derived.effectiveScoreState;
  return <EditScoreModal isOpen={true} matchFormat={match.format as TennisFormat} playerNames={{ p1: match.player1.name, p2: match.player2.name }} currentSets={derived.editScoreCurrentSets} currentServer={score.server} completedSets={derived.editScoreCompletedSets} currentGamePoints={{ player1: derived.gamePointToDisplay(score.currentGame?.player1 ?? 0), player2: derived.gamePointToDisplay(score.currentGame?.player2 ?? 0) }} floorCurrentSets={state.floorCurrentSets} suspendedSession={state.suspendedSession} onConfirm={handleEditScore} onCancel={handleEditScoreCancel} onMatchFinished={() => undefined} onRefreshFloor={handleEditScoreRefreshFloor} />;
}

function ServeEffectModalView({ data }: { data: ModalViewData }) {
  const { state, handlers, derived } = data;
  const { modalParams } = state;
  return <ServerEffectModal context={modalParams.context === 'winner' ? 'winner' : 'error'} serveStep={(modalParams.serveStep === 'second' ? 'second' : 'first') as 'first' | 'second'} errorType={modalParams.errorType as 'out' | 'net' | undefined} winnerName={derived.serverEffectWinnerName} fontScale={state.fontScale} onConfirm={modalParams.context === 'winner' ? handlers.handleServerEffectConfirm : handlers.handleServeErrorConfirm} onCancel={handlers.handleServeErrorCancel} />;
}

function PointDetailsModalView({ data }: { data: ModalViewData }) {
  const { state, handlers, derived, match } = data;
  return <PointDetailsModal winnerPlayerSide={(state.modalParams.winner as 'player1' | 'player2') ?? 'player1'} currentServer={derived.effectiveScoreState?.server ?? 'player1'} player1Name={match.player1.name} player2Name={match.player2.name} fontScale={state.fontScale} onConfirm={handlers.handlePointDetailsConfirm} onCancel={state.close} />;
}

function ModalStack({ data }: { data: ModalViewData }) {
  const { state, handlers, derived, match } = data;
  const modalData = { ...data, state, handlers, derived, match, handleSetupConfirm: data.handleSetupConfirm, handleUndo: data.handleUndo, handleEditScore: data.handleEditScore, handleEditScoreCancel: data.handleEditScoreCancel, handleEditScoreRefreshFloor: data.handleEditScoreRefreshFloor };
  const views: Record<string, JSX.Element> = {
    setup: <SetupModalView data={modalData} />,
    undo: <UndoModalView data={modalData} />,
    'edit-score': <EditScoreModalView data={modalData} />,
    'serve-effect': <ServeEffectModalView data={modalData} />,
    'point-details': <PointDetailsModalView data={modalData} />,
  };
  return views[state.activeModal ?? ''] ?? null;
}
