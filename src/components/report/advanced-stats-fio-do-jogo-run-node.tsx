import type { ChronoRun } from './advanced-stats-fio-do-jogo-runs';

// Nó do fluxo horizontal: card do scoring run + conector em seta
export function FlowRunNode({ run, isLast, player1Name, player2Name, p1Hex, p2Hex }: {
  run: ChronoRun;
  isLast: boolean;
  player1Name: string;
  player2Name: string;
  p1Hex: string;
  p2Hex: string;
}) {
  const isP1 = run.player === 'PLAYER_1';
  const isSuperRun = run.length >= 4;
  const playerHex = isP1 ? p1Hex : p2Hex;
  const pName = isP1 ? player1Name : player2Name;

  return (
    <div className="flex items-center gap-2">
      {/* CARD DO SCORING RUN */}
      <div
        data-testid="flow-run-node"
        className={`relative flex flex-col justify-between w-44 rounded-xl border p-3 transition-all hover:scale-[1.02] ${
          isP1
            ? 'border-telemetry-volt/40 bg-telemetry-volt/10 shadow-[0_0_15px_rgba(204,255,0,0.08)] -translate-y-2'
            : 'border-white/20 bg-white/5 translate-y-2'
        }`}
      >
        {/* Top Header do Card */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[11px] font-black uppercase tracking-wide truncate max-w-[90px]"
            style={{ color: playerHex }}
          >
            {pName}
          </span>
          <span
            className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${
              isSuperRun
                ? 'bg-telemetry-volt text-black font-extrabold shadow-[0_0_8px_#CCFF00]'
                : 'bg-black/40 text-telemetry-text-primary'
            }`}
          >
            +{run.length} pts
          </span>
        </div>

        {/* Set e Pontos */}
        <div className="text-[10px] text-telemetry-text-muted mb-2">
          Set {run.setNumber} · Pts #{run.startPointNumber} a #{run.endPointNumber}
        </div>

        {/* Destaques do Run (Aces, Winners, Breaks) */}
        <div className="flex flex-wrap gap-1">
          {isSuperRun && (
            <span className="text-[9px] font-bold bg-telemetry-volt/20 text-telemetry-volt px-1.5 py-0.5 rounded flex items-center gap-1">
              🔥 Super Run
            </span>
          )}
          {run.aces > 0 && (
            <span className="text-[9px] bg-white/10 text-telemetry-text-primary px-1.5 py-0.5 rounded">
              ⚡ {run.aces} Ace{run.aces > 1 ? 's' : ''}
            </span>
          )}
          {run.winners > 0 && (
            <span className="text-[9px] bg-white/10 text-telemetry-text-primary px-1.5 py-0.5 rounded">
              🎯 {run.winners} Winner{run.winners > 1 ? 's' : ''}
            </span>
          )}
          {run.breakPoints > 0 && (
            <span className="text-[9px] bg-telemetry-alert/20 text-telemetry-alert px-1.5 py-0.5 rounded">
              💥 Break!
            </span>
          )}
        </div>
      </div>

      {/* CONECTOR FLOW (Seta entre nós) */}
      {!isLast && (
        <div className="flex items-center justify-center px-1 text-white/30" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      )}
    </div>
  );
}
