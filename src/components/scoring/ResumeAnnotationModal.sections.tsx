import type { CompletedSetsInfo, SnapshotStatus } from './ResumeAnnotationModal.helpers';

interface BodyProps {
  player1Name: string; player2Name: string; format: string; completedSetsInfo: CompletedSetsInfo | null;
  previousPointsCount: number; snapshotStatus: SnapshotStatus; snapshotPointCount: number; bankPointCount: number;
  diff: number; error?: string | null;
}

export function ResumeAnnotationBody({ player1Name, player2Name, format, completedSetsInfo, previousPointsCount, snapshotStatus, snapshotPointCount, bankPointCount, diff, error }: BodyProps) {
  return <div className="px-5 py-4 space-y-3">
    <p className="text-gray-200 text-sm">Você saiu da partida <span className="text-blue-400 font-semibold">{player1Name} vs {player2Name}</span>.</p>
    <div className={`border-l-4 rounded px-3 py-2 text-sm ${snapshotStatus === 'IN_SYNC' ? 'border-green-500 bg-green-500/10 text-green-300' : snapshotStatus === 'SNAPSHOT_AHEAD' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-red-500 bg-red-500/10 text-red-300'}`}>
      <p className="font-semibold">{snapshotStatus === 'IN_SYNC' ? 'Sincronizado' : snapshotStatus === 'SNAPSHOT_AHEAD' ? 'Pontos offline' : 'Banco à frente'}</p>
      <p className="text-xs mt-0.5 opacity-80">Snapshot: {snapshotPointCount} ponto(s) | Banco: {bankPointCount} ponto(s)</p>
    </div>
    {completedSetsInfo && completedSetsInfo.total > 0 && <p className="text-gray-300 text-sm">Placar: {completedSetsInfo.completedSets.map((set) => `${set.player1}x${set.player2}`).join(', ')} ({format})</p>}
    {completedSetsInfo && !completedSetsInfo.total && <p className="text-gray-300 text-sm">Formato: {format}</p>}
    {completedSetsInfo?.current && !completedSetsInfo.isFinished && <p className="text-gray-300 text-sm">Set atual: {completedSetsInfo.current.player1} x {completedSetsInfo.current.player2}</p>}
    {previousPointsCount > 0 && snapshotStatus !== 'SNAPSHOT_AHEAD' && <p className="text-blue-300 text-sm">Você havia marcado {previousPointsCount} ponto(s).</p>}
    {snapshotStatus === 'SNAPSHOT_AHEAD' && <p className="text-amber-200 text-sm">Você tinha <span className="font-bold">{diff}</span> ponto(s) marcado(s) offline que não foram sincronizados. Deseja enviá-los agora?</p>}
    {snapshotStatus === 'BANK_AHEAD' && <p className="text-red-200 text-sm">A partida avançou <span className="font-bold">{diff}</span> ponto(s) desde que você saiu. Seu histórico local está desatualizado.</p>}
    {snapshotStatus === 'IN_SYNC' && <p className="text-gray-400 text-xs italic">Você pode retomar com o histórico de pontos para usar o undo, ou começar nova anotação.</p>}
    {error && <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-sm" role="alert"><p className="text-red-400">⚠️ {error}</p></div>}
  </div>;
}

interface FooterProps { snapshotStatus: SnapshotStatus; loading?: boolean; diff: number; onResume: () => void; onStartNew: () => void; onDiscard: () => void; }
const buttonBase = 'w-full py-2.5 rounded-xl font-bold text-sm';
export function ResumeAnnotationFooter({ snapshotStatus, loading, diff, onResume, onStartNew, onDiscard }: FooterProps) {
  if (snapshotStatus === 'SNAPSHOT_AHEAD') return <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2"><button onClick={onResume} disabled={loading} className={`${buttonBase} bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-all`}>{loading ? 'Sincronizando...' : `⬆️ Sincronizar ${diff} ponto(s) e retomar`}</button><button onClick={onStartNew} disabled={loading} className={`${buttonBase} bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 disabled:opacity-50 transition-all`}>Descartar pontos offline</button></div>;
  if (snapshotStatus === 'BANK_AHEAD') return <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2"><button onClick={onStartNew} disabled={loading} className={`${buttonBase} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all`}>{loading ? 'Carregando...' : '▶️ Retomar com estado atual'}</button><button onClick={onDiscard} disabled={loading} className={`${buttonBase} bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 transition-all`}>❌ Descartar</button></div>;
  return <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2"><button onClick={onResume} disabled={loading} className={`${buttonBase} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all`}>{loading ? 'Carregando...' : '✏️ Retomar (com undo)'}</button><button onClick={onStartNew} disabled={loading} className={`${buttonBase} bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 disabled:opacity-50 transition-all`}>🆕 Começar Nova Anotação</button><button onClick={onDiscard} disabled={loading} className={`${buttonBase} bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 transition-all`}>❌ Descartar</button></div>;
}
