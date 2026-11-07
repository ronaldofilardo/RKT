'use client';

import { useState } from 'react';
import type { MatchData } from '@/hooks/useScoringHandlers.types';
import { ChangeServerModalHeader } from './change-server-modal-header';
import { ChangeServerModalBody } from './change-server-modal-body';
import { ChangeServerModalFooter } from './change-server-modal-footer';

interface ChangeServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData;
  activeServerId?: string | null;
  onSelectServer: (serverId: string) => Promise<unknown> | void;
}

export function ChangeServerModal({
  isOpen,
  onClose,
  match,
  activeServerId,
  onSelectServer,
}: ChangeServerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDoubles = match.matchType === 'DOUBLES';

  const handleSelect = async (serverId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSelectServer(serverId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Singles: compute adversary ID for confirmation
  let confirmSinglesHandler: (() => void) | undefined;
  if (!isDoubles) {
    const rawServerSide =
      match.scoreState && typeof match.scoreState === 'object' && 'server' in match.scoreState
        ? (match.scoreState as { server?: string }).server
        : undefined;
    const currentServerId = activeServerId ?? (rawServerSide === 'player2' ? match.player2.id : match.player1.id);
    const adversary = currentServerId === match.player1.id ? match.player2 : match.player1;
    confirmSinglesHandler = () => handleSelect(adversary.id);
  }

  if (!isOpen) return null;

  const modalClass = isDoubles ? 'max-w-md' : 'max-w-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-telemetry-card border border-white/10 rounded-2xl p-5 ${modalClass} w-full shadow-2xl ${isDoubles ? 'space-y-4' : 'text-center space-y-4'}`}>
        <ChangeServerModalHeader isDoubles={isDoubles} match={match} activeServerId={activeServerId} />
        <ChangeServerModalBody
          isDoubles={isDoubles}
          match={match}
          activeServerId={activeServerId}
          isSubmitting={isSubmitting}
          onSelectServer={handleSelect}
        />
        <ChangeServerModalFooter
          isDoubles={isDoubles}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onConfirmSingles={confirmSinglesHandler}
        />
      </div>
    </div>
  );
}