'use client';

import React from 'react';
import { CopyIcon, WhatsAppIcon } from './share-spectate.icons';

interface Props {
  url: string;
  copied: boolean;
  onCopy: () => void;
}

export function ShareSpectateCreatedSection({ url, copied, onCopy }: Props) {
  const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Acompanhe a partida ao vivo no RKT: ${url}`
  )}`;

  // Display relative format like …/matches/convite/token for visual brevity
  const displayUrl = url.includes('/matches/convite/')
    ? `…/matches/convite/${url.split('/matches/convite/')[1]}`
    : url;

  return (
    <div className="flex flex-col gap-3">
      <div
        title={url}
        className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl px-3 py-2.5 font-mono text-xs text-telemetry-text-primary overflow-hidden whitespace-nowrap text-ellipsis"
      >
        {displayUrl}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="flex-1 py-2 bg-telemetry-elevated border border-telemetry-border/15 rounded-lg text-xs font-medium text-telemetry-text-primary hover:bg-telemetry-elevated/80 flex items-center justify-center gap-1.5 transition-colors"
        >
          <CopyIcon className="w-3.5 h-3.5 text-telemetry-text-muted" />
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>

        <a
          href={zapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-telemetry-elevated border border-telemetry-border/15 rounded-lg text-xs font-medium text-telemetry-text-primary hover:bg-telemetry-elevated/80 flex items-center justify-center gap-1.5 transition-colors"
        >
          <WhatsAppIcon className="w-3.5 h-3.5 text-telemetry-text-muted" />
          WhatsApp
        </a>
      </div>

      <p className="text-[13px] text-telemetry-text-muted m-0">
        O link aparece só agora. Se perder, crie outro.
      </p>
    </div>
  );
}

