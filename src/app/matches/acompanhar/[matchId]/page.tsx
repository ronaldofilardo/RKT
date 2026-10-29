'use client';

import { use } from 'react';
import { useSpectatorFeed } from '@/hooks/useSpectatorFeed';
import { SpectatorLiveContent } from './SpectatorLiveContent';
import { useRelativeUpdateText } from './useRelativeUpdateText';
import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';

export default function MatchSpectatePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const feed = useSpectatorFeed(matchId);
  const { view, status, isClientOffline, isRevoked, isNotFound, lastUpdated } = feed;

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
      <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-base">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-telemetry-bg text-telemetry-text-primary p-4 flex items-center justify-center">
      <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <SpectatorLiveContent view={view} feed={feed} updateText={updateText} />
      </div>
    </main>
  );
}
