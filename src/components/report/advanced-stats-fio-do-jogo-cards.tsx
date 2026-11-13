// Cards de resumo de domínio do Fio do Jogo (4 métricas)
export function FioDoJogoCards({ metrics, p1Hex, p2Hex }: {
  metrics: {
    p1Pct: number;
    p2Pct: number;
    p1RunPoints: number;
    p2RunPoints: number;
    maxStreakP1: number;
    maxStreakP2: number;
    p1SuperRuns: number;
    p2SuperRuns: number;
    totalRuns: number;
  };
  p1Hex: string;
  p2Hex: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
        <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
          Domínio em Sequências
        </div>
        <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
          <span style={{ color: p1Hex }}>{metrics.p1Pct}%</span>
          <span className="text-white/20 text-xs">vs</span>
          <span style={{ color: p2Hex }}>{metrics.p2Pct}%</span>
        </div>
        <div className="text-[10px] text-telemetry-text-muted mt-0.5">
          {metrics.p1RunPoints} pts vs {metrics.p2RunPoints} pts em runs
        </div>
      </div>

      <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
        <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
          Maior Sequência
        </div>
        <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
          <span style={{ color: p1Hex }}>{metrics.maxStreakP1} pts</span>
          <span className="text-white/20 text-xs">/</span>
          <span style={{ color: p2Hex }}>{metrics.maxStreakP2} pts</span>
        </div>
        <div className="text-[10px] text-telemetry-text-muted mt-0.5">
          Pico de domínio individual
        </div>
      </div>

      <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
        <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
          Super Runs (4+ Pts)
        </div>
        <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
          <span style={{ color: p1Hex }}>{metrics.p1SuperRuns}</span>
          <span className="text-white/20 text-xs">/</span>
          <span style={{ color: p2Hex }}>{metrics.p2SuperRuns}</span>
        </div>
        <div className="text-[10px] text-telemetry-text-muted mt-0.5">
          Sequências arrasadoras
        </div>
      </div>

      <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
        <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
          Total de Séries
        </div>
        <div className="font-mono font-black text-lg text-telemetry-text-primary">
          {metrics.totalRuns}
        </div>
        <div className="text-[10px] text-telemetry-text-muted mt-0.5">
          Alternâncias de momentum
        </div>
      </div>
    </div>
  );
}
