// Cabeçalhos de linha da timeline do report: banner de Tie-break de set e
// cabeçalho "Set N" (ambos independentes, sem estado/hook).

/**
 * Linha de banner de Tie-break de set — aparece imediatamente após a linha
 * "Fim do Game" que sinaliza a entrada no tiebreak (ex: 6x6 ou 9x9).
 * Visualmente separado da GameEndRow por ser uma linha de contexto independente,
 * com cor e ícone próprios para facilitar a leitura da timeline.
 */
export function TiebreakBannerRow({ colSpan, label, sublabel }: {
  colSpan: number;
  label: string;
  sublabel?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-1.5 text-center bg-telemetry-blue/10 border-y border-telemetry-blue/30"
      >
        <span className="text-[10px] font-bold text-telemetry-blue tracking-wide">
          🎾 {label}
        </span>
        {sublabel && (
          <span className="ml-2 text-[9px] text-telemetry-blue/60 font-normal">{sublabel}</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Linha de cabeçalho do set ("Set N") — oculta quando há filtros ativos.
 * Match Tiebreak decisivo usa cor/etiqueta distintas do set regular.
 */
export function SetHeaderRow({ colSpan, setNumber, isMatchTb }: {
  colSpan: number;
  setNumber: number;
  isMatchTb?: boolean;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        aria-label={`Set ${setNumber}`}
        className={[
          'px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border-y border-white/10',
          // Match Tiebreak decisivo: fundo e cor distintos para sinalizar o formato especial
          isMatchTb
            ? 'text-telemetry-blue bg-telemetry-blue/15 border-telemetry-blue/30'
            : 'text-telemetry-text-primary bg-telemetry-elevated',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <span>Set {setNumber}</span>
          {isMatchTb && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-telemetry-blue/20 text-telemetry-blue font-semibold normal-case">
              Match Tie-break
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
