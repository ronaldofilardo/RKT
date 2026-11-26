import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';
import { ERROR_STATES, type InviteErrorCode } from './invite-error-states';

interface InviteErrorViewProps {
  errorCode: InviteErrorCode | null;
  onRetry: () => void;
}

/** Cartão de erro/limite do redeem de convite (com retry para SPECTATOR_LIMIT). */
export function InviteErrorView({ errorCode, onRetry }: InviteErrorViewProps) {
  return (
    <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-5 shadow-xl">
      {errorCode === 'SPECTATOR_LIMIT' ? (
        <SpectatorEmptyState
          icon="users"
          title="Esta partida está lotada"
          description="Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga."
          actionText="Tentar de novo"
          onAction={onRetry}
        />
      ) : (
        (() => {
          const errState = ERROR_STATES[errorCode ?? 'INVITE_INVALID'];
          return (
            <SpectatorEmptyState
              icon={errState.icon}
              title={errState.title}
              description={errState.description}
              actionText={errState.actionText}
              actionHref={errState.actionHref}
            />
          );
        })()
      )}
    </div>
  );
}
