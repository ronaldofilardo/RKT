'use client';

interface EditScoreFormHeaderProps {
  totalEditedSets: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
}

/** Rótulo do set em edição (com selo de match tiebreak potencial). */
export function EditScoreFormHeader({
  totalEditedSets,
  isMatchTiebreakSet,
  isPotentialMTSet,
}: EditScoreFormHeaderProps) {
  return (
    <>
      {isMatchTiebreakSet ? (
        <p className="text-xs font-semibold text-telemetry-volt uppercase tracking-wide">
          Set {totalEditedSets + 1} — Match Tiebreak
        </p>
      ) : isPotentialMTSet ? (
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
            Set {totalEditedSets + 1}
          </p>
          <span className="text-[10px] text-telemetry-alert bg-telemetry-alert/10 px-1.5 py-0.5 rounded">
            Pode virar MT em 6-6
          </span>
        </div>
      ) : (
        <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
          Set {totalEditedSets + 1}
        </p>
      )}
    </>
  );
}

/** Aviso exibido no lugar do formulário quando a partida já terminou. */
export function EditScoreMatchOverCard() {
  return (
    <div className="space-y-3 rounded-lg bg-telemetry-card border border-white/10 p-4">
      <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
        Partida Encerrada
      </p>
      <p className="text-xs text-telemetry-text-muted">
        A partida já foi finalizada. Não é possível adicionar novos sets.
      </p>
    </div>
  );
}
