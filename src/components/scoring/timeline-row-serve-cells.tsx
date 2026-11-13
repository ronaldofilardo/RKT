'use client';

// Classes base de célula da timeline (compartilhadas com IdentityCells e RallyDetailCells)
// e as células de resultado do saque (ACE/OUT/NET + efeito + direção).
export const TD = 'px-1.5 py-1.5 text-[10px] text-center';
export const MUTED = `${TD} text-telemetry-text-muted`;

function FlagCell({ active, label, color }: { active: boolean; label: string; color: string }) {
  return (
    <td className={`${TD} text-center font-semibold ${active ? color : 'text-telemetry-text-muted/50'}`}>
      {active ? label : '–'}
    </td>
  );
}

/** 5 células de um saque: ACE, OUT, NET, Efeito e Direção. */
export function ServeOutcomeCells({ outcome, effect, direction }: {
  outcome: string | null | undefined;
  effect: string;
  direction: string;
}) {
  return (
    <>
      <FlagCell active={outcome === 'ace'} label="ACE" color="text-green-400" />
      <FlagCell active={outcome === 'out'} label="OUT" color="text-telemetry-error" />
      <FlagCell active={outcome === 'net'} label="NET" color="text-telemetry-alert" />
      <td className={MUTED}>{effect}</td>
      <td className={MUTED}>{direction}</td>
    </>
  );
}
