import type { TimelinePoint } from '@/core/scoring/types';

// Fita ponto-a-ponto (bead momentum ribbon) + inspeção do ponto selecionado
export function FioDoJogoRibbon({ ribbonPoints, inspectedPoint, onInspect, player1Name, player2Name }: {
  ribbonPoints: TimelinePoint[];
  inspectedPoint: TimelinePoint | null;
  onInspect: (point: TimelinePoint) => void;
  player1Name: string;
  player2Name: string;
}) {
  if (ribbonPoints.length === 0) return null;

  return (
    <div className="bg-black/20 rounded-xl border border-white/5 p-3.5">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-bold text-telemetry-text-primary uppercase tracking-wider text-[11px]">
          Fita Ponto-a-Ponto
        </span>
        <span className="text-[10px] text-telemetry-text-muted">
          Passe o mouse ou toque para inspecionar cada ponto
        </span>
      </div>

      {/* Trilha de Contas / Beads com scroll horizontal */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="flex items-center gap-1 min-w-max">
          {ribbonPoints.map((pt, index) => {
            const isP1 = pt.winner === 'PLAYER_1';
            const isAce = pt.type === 'ACE';
            const isWinnerShot = pt.type === 'WINNER';
            const isDoubleFault = pt.type === 'DOUBLE_FAULT';
            const isBP = pt.isBreakPoint;

            // Letra de destaque no bead
            let badgeChar = '•';
            if (isAce) badgeChar = 'A';
            else if (isWinnerShot) badgeChar = 'W';
            else if (isDoubleFault) badgeChar = 'DF';
            else if (isBP) badgeChar = 'BP';

            const isSelected = inspectedPoint?.pointNumber === pt.pointNumber;

            return (
              <button
                key={pt.pointNumber ?? index}
                type="button"
                data-testid="point-bead"
                data-point-number={pt.pointNumber}
                onClick={() => onInspect(pt)}
                className={`relative flex items-center justify-center rounded-md font-mono font-bold transition-all ${
                  badgeChar.length > 1 ? 'w-6 h-6 text-[8px]' : 'w-5 h-5 text-[9px]'
                } ${
                  isP1
                    ? 'bg-telemetry-volt text-black hover:ring-2 hover:ring-telemetry-volt'
                    : 'bg-white/90 text-black hover:ring-2 hover:ring-white'
                } ${isSelected ? 'scale-125 ring-2 ring-white z-10' : ''}`}
                title={`Ponto #${pt.pointNumber} · Set ${pt.setNumber} · Vencedor: ${isP1 ? player1Name : player2Name} (${pt.type})`}
              >
                {badgeChar}
              </button>
            );
          })}
        </div>
      </div>

      {/* INSPEÇÃO DO PONTO SELECIONADO */}
      {inspectedPoint ? (
        <div className="mt-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-wrap items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold text-telemetry-volt">Ponto #{inspectedPoint.pointNumber}</span>
            <span className="text-white/30">•</span>
            <span>Set {inspectedPoint.setNumber}</span>
            <span className="text-white/30">•</span>
            <span className="font-semibold text-telemetry-text-primary">
              Vencedor: {inspectedPoint.winner === 'PLAYER_1' ? player1Name : player2Name}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-telemetry-text-muted">Tipo: {inspectedPoint.type}</span>
          </div>
          <div className="text-[11px] text-telemetry-text-muted font-mono">
            Placar: {inspectedPoint.gameScore?.player1 ?? 0}-{inspectedPoint.gameScore?.player2 ?? 0}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-telemetry-text-muted italic">
          Dica: clique em qualquer ponto da fita para abrir a telemetria do lance.
        </div>
      )}
    </div>
  );
}
