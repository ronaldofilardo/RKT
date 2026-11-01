const COL_WIDTHS = [
  '3%', '3%', '5%', '3%', '4%', '5%', '3%', '3%', '3%', '4%',
  '4%', '3%', '3%', '3%', '4%', '4%', '5%', '4%', '4%', '4%',
  '4%', '4%', '4%', '5%', '4%',
];

export function TimelineTableHead() {
  return (
    <>
      <colgroup>
        {COL_WIDTHS.map((width, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
      <thead className="sticky top-0 z-20 shadow-sm">
        <tr className="bg-telemetry-elevated border-b border-white/10">
          <th colSpan={3} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 left-0 bg-telemetry-elevated z-30 border-r border-white/10">SET</th>
          <th colSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10 sticky top-0 bg-telemetry-elevated z-20">PLACAR</th>
          <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10 sticky top-0 bg-telemetry-elevated z-20">1º Saque</th>
          <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10 sticky top-0 bg-telemetry-elevated z-20">2º Saque</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">SITUAÇÃO</th>
          <th rowSpan={2} aria-label="TIPO (ENF, EF, W)" className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-l border-white/10 sticky top-0 bg-telemetry-elevated z-20">
            <div className="flex flex-col leading-tight">
              <span>TIPO</span>
              <span className="text-[7px] font-normal text-telemetry-text-muted/50 normal-case">ENF, EF, W</span>
            </div>
          </th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">ERRO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">ONDE</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">GOLPE</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">EFEITO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">DIREÇÃO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">ESPECIAL</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">RALLY</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky top-0 bg-telemetry-elevated z-20">OBS</th>
        </tr>
        <tr className="bg-telemetry-card border-b border-white/5">
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] left-0 bg-telemetry-card z-30">no.</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] left-[3%] bg-telemetry-card z-30">SAC</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10 sticky top-[24px] left-[6%] bg-telemetry-card z-30">Venc</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">GAMES</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10 sticky top-[24px] bg-telemetry-card z-20">PONTOS</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">ACE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">OUT</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">NET</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">EFE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10 sticky top-[24px] bg-telemetry-card z-20">DIR</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">ACE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">OUT</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">NET</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase sticky top-[24px] bg-telemetry-card z-20">EFE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10 sticky top-[24px] bg-telemetry-card z-20">DIR</th>
        </tr>
      </thead>
    </>
  );
}
