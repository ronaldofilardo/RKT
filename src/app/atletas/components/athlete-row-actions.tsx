import type { Athlete } from '../atletas.types';

interface AthleteRowActionsProps {
  athlete: Athlete;
  canDelete: boolean;
  isClubCoach?: boolean;
  isUnder18?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateLink?: (athlete: Athlete) => void;
  loadingLink?: boolean;
}

export function AthleteRowActions({
  athlete, canDelete, isClubCoach, isUnder18,
  onEdit, onDelete, onGenerateLink, loadingLink,
}: AthleteRowActionsProps) {
  return (
    <div className="inline-flex items-center gap-1">
      {onGenerateLink && (
        <button
          type="button" onClick={() => onGenerateLink(athlete)} disabled={loadingLink}
          aria-label={`Link de acesso de ${athlete.name}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5 text-telemetry-volt" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Link</span>
        </button>
      )}
      {isClubCoach ? (
        isUnder18 ? (
          <button
            type="button" disabled aria-disabled="true"
            title="Edição desabilitada para atletas menores de 18 anos"
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated/50 border border-white/5 text-telemetry-text-muted/40 text-xs sm:text-sm font-medium rounded-lg cursor-not-allowed opacity-50 shadow-sm"
          >
            Editar
          </button>
        ) : (
          <button
            type="button" onClick={onEdit} aria-label={`Ver ficha de ${athlete.name}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
          >
            <span aria-hidden="true">👁️</span>
            <span>Ver Ficha</span>
          </button>
        )
      ) : (
        <button
          type="button" onClick={onEdit}
          className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
        >
          Editar
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
