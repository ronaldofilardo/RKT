import { useMemo } from 'react';
import { getCompletedSetsInfo, type SnapshotStatus } from './ResumeAnnotationModal.helpers';
import { ResumeAnnotationBody, ResumeAnnotationFooter } from './ResumeAnnotationModal.sections';

interface ResumeAnnotationModalProps {
  player1Name: string; player2Name: string; format: string; matchStateSnapshot: string | null; previousPointsCount: number;
  snapshotStatus?: SnapshotStatus; snapshotPointCount?: number; bankPointCount?: number; onResume: () => void; onStartNew: () => void;
  onDiscard: () => void; loading?: boolean; error?: string | null;
}

export function ResumeAnnotationModal({
  player1Name, player2Name, format, matchStateSnapshot, previousPointsCount, snapshotStatus = 'IN_SYNC', snapshotPointCount = 0,
  bankPointCount = 0, onResume, onStartNew, onDiscard, loading, error,
}: ResumeAnnotationModalProps) {
  const completedSetsInfo = useMemo(() => getCompletedSetsInfo(matchStateSnapshot, format), [matchStateSnapshot, format]);
  const diff = Math.abs(snapshotPointCount - bankPointCount);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', animation: 'fadeIn 200ms ease-out' }} role="button" tabIndex={-1} aria-label="Fechar modal" onClick={(e) => { if (e.target === e.currentTarget) onDiscard(); }} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onDiscard(); }}>
      <div className="bg-gray-800 border-2 border-blue-500 rounded-xl max-w-[420px] w-[clamp(300px,85vw,420px)] mx-4 shadow-2xl animate-[slideUp_300ms_ease-out]" role="dialog" aria-label="Retomar anotação" tabIndex={-1}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{snapshotStatus === 'SNAPSHOT_AHEAD' ? '⚠️ Pontos Offline' : '👉 Retomar Anotação?'}</h2>
          <button onClick={onDiscard} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="Fechar">✕</button>
        </div>
        <ResumeAnnotationBody player1Name={player1Name} player2Name={player2Name} format={format} completedSetsInfo={completedSetsInfo} previousPointsCount={previousPointsCount} snapshotStatus={snapshotStatus} snapshotPointCount={snapshotPointCount} bankPointCount={bankPointCount} diff={diff} error={error} />
        <ResumeAnnotationFooter snapshotStatus={snapshotStatus} loading={loading} diff={diff} onResume={onResume} onStartNew={onStartNew} onDiscard={onDiscard} />
      </div>
    </div>
  );
}
