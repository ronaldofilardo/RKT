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
      <thead>
        <tr className="bg-telemetry-elevated border-b border-white/10">
          <th colSpan={3} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky left-0 bg-telemetry-elevated z-20 border-r border-white/10">SET</th>
          <th colSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">PLACAR</th>
          <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">1º Saque</th>
          <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">2º Saque</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">SITUAÇÃO</th>
          <th rowSpan={2} aria-label="TIPO (ENF, EF, W)" className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-l border-white/10">
            <div className="flex flex-col leading-tight">
              <span>TIPO</span>
              <span className="text-[7px] font-normal text-telemetry-text-muted/50 normal-case">ENF, EF, W</span>
            </div>
          </th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ERRO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ONDE</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">GOLPE</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">EFEITO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">DIREÇÃO</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ESPECIAL</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">RALLY</th>
          <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">OBS</th>
        </tr>
        <tr className="bg-telemetry-card border-b border-white/5">
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">no.</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">SAC</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">Venc</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">GAMES</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">PONTOS</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">ACE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">OUT</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">NET</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">EFE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">DIR</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">ACE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">OUT</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">NET</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">EFE</th>
          <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">DIR</th>
        </tr>
      </thead>
    </>
  );
}
