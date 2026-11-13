import type { ChronoRun } from './advanced-stats-fio-do-jogo-runs';
import { FlowRunNode } from './advanced-stats-fio-do-jogo-run-node';

// Flow chart horizontal dos scoring runs ( Superior: P1 / Inferior: P2 )
export function FioDoJogoFlow({ filteredRuns, player1Name, player2Name, p1Hex, p2Hex }: {
  filteredRuns: ChronoRun[];
  player1Name: string;
  player2Name: string;
  p1Hex: string;
  p2Hex: string;
}) {
  return (
    <div className="bg-black/30 rounded-xl border border-white/10 p-4 mb-5">
      <div className="flex items-center justify-between text-xs text-telemetry-text-muted mb-3">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p1Hex }} />
          <span>Superior: {player1Name}</span>
        </span>
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          Fluxo de Sequências Consecutivas (Linha do Tempo)
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p2Hex }} />
          <span>Inferior: {player2Name}</span>
        </span>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="py-8 text-center text-xs text-telemetry-text-muted">
          Nenhuma sequência consecutiva encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="overflow-x-auto pb-3 pt-2">
          <div className="flex items-center gap-2 min-w-max">
            {filteredRuns.map((run, idx) => (
              <FlowRunNode
                key={run.id}
                run={run}
                isLast={idx === filteredRuns.length - 1}
                player1Name={player1Name}
                player2Name={player2Name}
                p1Hex={p1Hex}
                p2Hex={p2Hex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
