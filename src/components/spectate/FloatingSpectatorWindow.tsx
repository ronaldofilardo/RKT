'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpectatorFeed } from '@/hooks/useSpectatorFeed';
import { SpectatorLiveContent } from '@/app/matches/acompanhar/[matchId]/SpectatorLiveContent';
import { useRelativeUpdateText } from '@/app/matches/acompanhar/[matchId]/useRelativeUpdateText';
import type { FloatingSpectatorItem } from '@/contexts/floating-spectator.logic';
import { FloatingSpectatorPanel } from './FloatingSpectatorPanel';
import { FloatingSpectatorPill } from './FloatingSpectatorPill';
import { summarizeScore } from './floating-spectator-summary.logic';
import { useDraggablePosition } from './use-floating-window';

const AUTO_MIN_POLL_MS = 15_000;

interface Props {
  item: FloatingSpectatorItem;
  index: number;
  expanded: boolean;
  isDesktop: boolean;
  zIndex: number;
  dock: HTMLElement | null;
  onToggle: () => void;
  onClose: () => void;
  onFocus: () => void;
}

/**
 * Sempre montada (mesmo minimizada) para manter o estado e o placar da pílula.
 * Por padrão NÃO faz polling: busca ao abrir e quando o gestor clica em Atualizar.
 */
export function FloatingSpectatorWindow({ item, index, expanded, isDesktop, zIndex, dock, onToggle, onClose, onFocus }: Props) {
  const [auto, setAuto] = useState(false);
  const feed = useSpectatorFeed(item.matchId, { autoPoll: auto, minPollMs: AUTO_MIN_POLL_MS });
  const { pos, handlers } = useDraggablePosition(index);
  const updateText = useRelativeUpdateText(feed.lastUpdated, feed.status, feed.isClientOffline);
  const { view } = feed;

  const title = view ? view.match.sides.map((s) => s.label).join(' × ') : item.title;
  const summary = view ? summarizeScore(view.score, feed.status === 'FINISHED') : '';

  let body;
  if (feed.isRevoked || feed.isNotFound) {
    body = <p className="m-0 text-sm text-telemetry-text-muted text-center py-6">Você não tem acesso a esta partida.</p>;
  } else if (!view) {
    body = <div className="mx-auto my-8 w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />;
  } else {
    body = <SpectatorLiveContent view={view} feed={feed} updateText={updateText} hideHeader />;
  }

  return (
    <>
      {expanded && (
        <FloatingSpectatorPanel
          title={title}
          updateText={updateText}
          isDesktop={isDesktop}
          pos={pos}
          zIndex={zIndex}
          dragHandlers={handlers}
          auto={auto}
          onToggleAuto={() => setAuto((v) => !v)}
          isRefreshing={feed.isRefreshing}
          onRefresh={feed.refresh}
          onMinimize={onToggle}
          onClose={onClose}
          onFocus={onFocus}
        >
          {body}
        </FloatingSpectatorPanel>
      )}
      {!expanded && dock && createPortal(
        <FloatingSpectatorPill title={title} summary={summary} live={feed.status === 'LIVE'} onExpand={onToggle} onClose={onClose} />,
        dock,
      )}
    </>
  );
}
