import { ShieldCheckIcon, LinkIcon } from './athlete-row-icons';

interface AthleteRowActionsAthlete { id: string; name: string; }

interface AthleteRowActionsProps {
  athlete: AthleteRowActionsAthlete;
  canDelete: boolean;
  isClubCoach?: boolean;
  isUnder18?: boolean;
  isMinorConsented?: boolean;
  editLabel?: string;
  editDisabledReason?: string | null;
  hasAccount?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateLink?: (athlete: AthleteRowActionsAthlete) => void;
  onEcaConsent?: (athlete: AthleteRowActionsAthlete) => void;
  loadingLink?: boolean;
}

export function AthleteRowActions({
  athlete, canDelete, isClubCoach, isUnder18, isMinorConsented,
  editLabel, editDisabledReason, hasAccount,
  onEdit, onDelete, onGenerateLink, onEcaConsent, loadingLink,
}: AthleteRowActionsProps) {
  const label = editLabel ?? (isClubCoach && !isUnder18 ? 'Ver Ficha' : 'Editar');
  const disabledReason = editDisabledReason ?? (isClubCoach && isUnder18 ? 'Edição desabilitada para menores' : null);
  const linkTitle = isUnder18
    ? 'Gerar link de ativação do menor e aviso ao responsável'
    : (hasAccount ? 'Gerar link de redefinição de senha' : 'Criar conta de acesso e gerar link de senha');

  return (
    <div className="inline-flex items-center gap-1">
      {isUnder18 && (
        isMinorConsented ? (
          <span title="Consentimento do responsável legal confirmado (ECA)" className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg select-none">
            <ShieldCheckIcon /><span className="hidden sm:inline">ECA ✓</span>
          </span>
        ) : onEcaConsent ? (
          <button
            type="button" onClick={() => onEcaConsent(athlete)}
            aria-label={`ECA - Consentimento do responsável de ${athlete.name}`}
            title="Gerenciar consentimento do responsável legal (ECA)"
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span>ECA</span>
          </button>
        ) : null
      )}

      {onGenerateLink && (
        isUnder18 && !isMinorConsented ? (
          <button
            type="button" disabled aria-disabled="true"
            title="Aguardando autorização do responsável (ECA). Clique no botão ECA para enviar o link ao responsável."
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated/40 border border-white/5 text-telemetry-text-muted/40 text-xs sm:text-sm font-medium rounded-lg cursor-not-allowed opacity-40 shadow-sm"
          >
            <LinkIcon /><span>Link</span>
          </button>
        ) : (
          <button
            type="button" onClick={() => onGenerateLink(athlete)} disabled={loadingLink}
            aria-label={`Link de acesso de ${athlete.name}`} title={linkTitle}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm disabled:opacity-50"
          >
            <LinkIcon /><span>Link</span>
          </button>
        )
      )}

      {disabledReason ? (
        <button type="button" disabled aria-disabled="true" title={disabledReason} className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated/50 border border-white/5 text-telemetry-text-muted/40 text-xs sm:text-sm font-medium rounded-lg cursor-not-allowed opacity-50 shadow-sm">
          {label}
        </button>
      ) : (
        <button type="button" onClick={onEdit} aria-label={label === 'Editar' ? undefined : `Ver ficha de ${athlete.name}`} className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer">
          {label === 'Ver Ficha' && <span aria-hidden="true">👁️</span>}<span>{label}</span>
        </button>
      )}

      {canDelete && (
        <button type="button" onClick={onDelete} aria-label={`Excluir atleta ${athlete.name}`} className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs sm:text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors cursor-pointer">
          Excluir
        </button>
      )}
    </div>
  );
}
