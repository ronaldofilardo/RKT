'use client';

import React from 'react';
import { CloseIcon } from './share-spectate.icons';
import { ShareSpectateCreateSection } from './ShareSpectateCreateSection';
import { ShareSpectateCreatedSection } from './ShareSpectateCreatedSection';
import { ShareSpectateWatchersList } from './ShareSpectateWatchersList';
import { useShareSpectateModal } from './useShareSpectateModal';

export interface ShareSpectateModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  matchContext?: string;
}

export function ShareSpectateModal({
  matchId,
  isOpen,
  onClose,
  matchContext,
}: ShareSpectateModalProps) {
  const {
    label,
    setLabel,
    createdUrl,
    loading,
    createError,
    revoking,
    copied,
    spectators,
    createLink,
    revokeLink,
    removeSpectator,
    copyLink,
  } = useShareSpectateModal(matchId, isOpen);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-spectate-title"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2
            id="share-spectate-title"
            className="font-medium text-base text-telemetry-text-primary m-0"
          >
            {createdUrl ? 'Convite criado' : 'Compartilhar partida'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-telemetry-text-muted hover:text-telemetry-text-primary p-1 rounded-md transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {!createdUrl ? (
          <ShareSpectateCreateSection
            matchContext={matchContext}
            label={label}
            loading={loading}
            error={createError}
            onLabelChange={setLabel}
            onSubmit={createLink}
          />
        ) : (
          <>
            <ShareSpectateCreatedSection
              url={createdUrl}
              copied={copied}
              onCopy={copyLink}
            />
            <ShareSpectateWatchersList
              spectators={spectators}
              onRemoveSpectator={removeSpectator}
              onRevokeLink={revokeLink}
              onCopyLink={copyLink}
              revoking={revoking}
            />
          </>
        )}
      </div>
    </div>
  );
}
