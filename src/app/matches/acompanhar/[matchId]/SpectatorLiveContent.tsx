'use client';

import type { SpectatorView } from '@/core/spectate/types';
import type { SpectatorFeedState } from '@/hooks/useSpectatorFeed';
import { SpectatorHeader } from './SpectatorHeader';
import { SpectatorCorrectionBanner } from './SpectatorCorrectionBanner';
import { SpectatorScoreboard } from './SpectatorScoreboard';
import { SpectatorLastPointBanner } from './SpectatorLastPointBanner';
import { SpectatorTabs } from './SpectatorTabs';
import { SpectatorScoreEditNotice } from './SpectatorScoreEditNotice';
import { SpectatorScoreAnnouncer } from './SpectatorScoreAnnouncer';
import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';
import { SpectatorStatusBanner } from '@/components/spectate/SpectatorStatusBanner';

interface Props {
  view: SpectatorView;
  feed: SpectatorFeedState;
  updateText: string;
  /** No popup flutuante o título/status ficam na barra da janela. */
  hideHeader?: boolean;
}

/** Conteúdo da tela de acompanhamento (compartilhado entre a página do convite e o popup do gestor). */
export function SpectatorLiveContent({ view, feed, updateText, hideHeader = false }: Props) {
  const {
    status, ageSeconds, rhythm, correctionAlert, clearCorrectionAlert,
    isClientOffline, isSessionExpired, resumeSession, lastUpdated,
  } = feed;

  const [side1, side2] = view.match.sides;
  const lastPoint = view.points.length > 0 ? view.points[view.points.length - 1] : null;
  const lastWinnerName = lastPoint ? (lastPoint.winnerSide === 'side1' ? side1.label : side2.label) : undefined;
  const showBanner = isClientOffline || status === 'NO_SIGNAL' || status === 'PAUSED';
  const bannerKind = isClientOffline ? 'OFFLINE' : status === 'NO_SIGNAL' ? 'NO_SIGNAL' : 'PAUSED';

  return (
    <>
      <SpectatorScoreAnnouncer score={view.score} side1Label={side1.label} side2Label={side2.label} />
      {!hideHeader && <SpectatorHeader match={view.match} status={status} updateText={updateText} />}
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
          <SpectatorScoreEditNotice markers={view.markers ?? []} />
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
    </>
  );
}
