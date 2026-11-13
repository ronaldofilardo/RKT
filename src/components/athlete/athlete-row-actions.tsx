interface AthleteRowActionsAthlete {
  id: string;
  name: string;
}

interface AthleteRowActionsProps {
  athlete: AthleteRowActionsAthlete;
  canDelete: boolean;
  isClubCoach?: boolean;
  isUnder18?: boolean;
  editLabel?: string;
  editDisabledReason?: string | null;
  hasAccount?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateLink?: (athlete: AthleteRowActionsAthlete) => void;
  loadingLink?: boolean;
}

/** Ações de linha padrão das tabelas de atletas: Link · Editar/Ver Ficha · Excluir. */
export function AthleteRowActions({
  athlete, canDelete, isClubCoach, isUnder18,
  editLabel, editDisabledReason, hasAccount,
  onEdit, onDelete, onGenerateLink, loadingLink,
}: AthleteRowActionsProps) {
  const label = editLabel ?? (isClubCoach && !isUnder18 ? 'Ver Ficha' : 'Editar');
  const disabledReason = editDisabledReason ?? (isClubCoach && isUnder18
    ? 'Edição desabilitada para atletas menores de 18 anos'
    : null);
  const linkTitle = hasAccount
    ? 'Gerar link de redefinição de senha'
    : 'Criar conta de acesso e gerar link de senha';

  return (
    <div className="inline-flex items-center gap-1">
      {onGenerateLink && (
        <button
          type="button" onClick={() => onGenerateLink(athlete)} disabled={loadingLink}
          aria-label={`Link de acesso de ${athlete.name}`} title={linkTitle}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5 text-telemetry-volt" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Link</span>
        </button>
      )}

      {disabledReason ? (
        <button
          type="button" disabled aria-disabled="true" title={disabledReason}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated/50 border border-white/5 text-telemetry-text-muted/40 text-xs sm:text-sm font-medium rounded-lg cursor-not-allowed opacity-50 shadow-sm"
        >
          {label}
        </button>
      ) : (
        <button
          type="button" onClick={onEdit}
          aria-label={label === 'Editar' ? undefined : `Ver ficha de ${athlete.name}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
        >
          {label === 'Ver Ficha' && <span aria-hidden="true">👁️</span>}
          <span>{label}</span>
        </button>
      )}

      {canDelete && (
        <button
          type="button" onClick={onDelete} aria-label={`Excluir atleta ${athlete.name}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs sm:text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors cursor-pointer"
        >
          Excluir
        </button>
      )}
    </div>
  );
}
