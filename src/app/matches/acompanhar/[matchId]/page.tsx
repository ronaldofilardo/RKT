'use client';

import { use } from 'react';
import { useSpectatorFeed } from '@/hooks/useSpectatorFeed';
import { SpectatorHeader } from './SpectatorHeader';
import { SpectatorCorrectionBanner } from './SpectatorCorrectionBanner';
import { SpectatorScoreboard } from './SpectatorScoreboard';
import { SpectatorLastPointBanner } from './SpectatorLastPointBanner';
import { SpectatorTabs } from './SpectatorTabs';
import { SpectatorScoreAnnouncer } from './SpectatorScoreAnnouncer';
import { useRelativeUpdateText } from './useRelativeUpdateText';
import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';
import { SpectatorStatusBanner } from '@/components/spectate/SpectatorStatusBanner';

export default function MatchSpectatePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const {
    view, status, ageSeconds, rhythm, correctionAlert, clearCorrectionAlert,
    isClientOffline, isRevoked, isNotFound, isSessionExpired, resumeSession, lastUpdated,
  } = useSpectatorFeed(matchId);

  const updateText = useRelativeUpdateText(lastUpdated, status, isClientOffline);

  if (isRevoked || isNotFound) {
    return (
      <main className="min-h-screen bg-telemetry-bg text-telemetry-text-primary p-4 flex items-center justify-center">
        <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-4 shadow-xl">
          <SpectatorEmptyState
            icon={isRevoked ? 'lock' : 'link-off'}
            title={isRevoked ? 'Seu acesso foi encerrado' : 'Convite inválido ou expirado'}
            description={isRevoked ? 'O dono da partida removeu seu acesso. Peça um novo convite.' : 'Confira o link ou peça um novo ao dono da partida.'}
            actionText="Voltar ao início"
            actionHref="/dashboard"
          />
        </div>
      </main>
    );
  }

  if (!view) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-bg">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const [side1, side2] = view.match.sides;
  const lastPoint = view.points.length > 0 ? view.points[view.points.length - 1] : null;
  const lastWinnerName = lastPoint ? (lastPoint.winnerSide === 'side1' ? side1.label : side2.label) : undefined;
  const showBanner = isClientOffline || status === 'NO_SIGNAL' || status === 'PAUSED';
  const bannerKind = isClientOffline ? 'OFFLINE' : status === 'NO_SIGNAL' ? 'NO_SIGNAL' : 'PAUSED';

  return (
    <main className="min-h-screen bg-telemetry-bg text-telemetry-text-primary p-4 flex items-center justify-center">
      <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <SpectatorScoreAnnouncer score={view.score} side1Label={side1.label} side2Label={side2.label} />
        <SpectatorHeader match={view.match} status={status} updateText={updateText} />
        <SpectatorCorrectionBanner alert={correctionAlert} onDismiss={clearCorrectionAlert} />

        {showBanner && <SpectatorStatusBanner kind={bannerKind} ageSeconds={ageSeconds} lastUpdated={lastUpdated} />}

        {status === 'NOT_STARTED' ? (
          <SpectatorEmptyState
            icon="hourglass"
            title="A partida ainda não começou"
            description="Os pontos aparecem aqui assim que o anotador registrar o primeiro."
          />
        ) : (
          <>
            <SpectatorScoreboard view={view} isDimmed={isClientOffline || status === 'NO_SIGNAL'} />
            <SpectatorLastPointBanner lastPoint={lastPoint} winnerName={lastWinnerName} rhythm={rhythm} />
            {status === 'FINISHED' && (
              <p className="text-xs text-telemetry-text-muted m-0 text-center">
                Encerrada. Você acompanha até 7 dias após o término.
              </p>
            )}
            <SpectatorTabs view={view} />
          </>
        )}

        {isSessionExpired && (
          <div className="p-2.5 rounded-lg bg-telemetry-base/80 border border-telemetry-border/20 text-center space-y-1.5">
            <p className="text-xs text-telemetry-text-muted m-0">Transmissão em pausa para economizar dados.</p>
            <button
              type="button"
              onClick={resumeSession}
              className="px-3 py-1 bg-white text-black text-xs font-medium rounded-md hover:bg-white/90 transition-colors"
            >
              Continuar acompanhando
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
