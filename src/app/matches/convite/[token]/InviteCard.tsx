import React from 'react';
import Link from 'next/link';
import { EyeIcon } from '@/components/scoring/share-spectate.icons';

export interface InvitePreviewData {
  inviterName: string;
  matchTitle: string;
  courtAndSet: string;
  status: string;
  matchId: string;
}

interface Props {
  preview: InvitePreviewData;
  redeeming: boolean;
  onRedeem: () => void;
}

export function InviteCard({ preview, redeeming, onRedeem }: Props) {
  return (
    <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-5 flex flex-col gap-3.5 text-center shadow-xl">
      <div className="w-11 h-11 rounded-full bg-sky-950/70 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
        <EyeIcon className="w-5 h-5" />
      </div>

      <div>
        <h1 className="font-medium text-base text-telemetry-text-primary m-0">
          Convite para acompanhar
        </h1>
        <p className="text-[13px] text-telemetry-text-muted mt-1 m-0">
          {preview.inviterName} convidou você para ver esta partida.
        </p>
      </div>

      <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 text-center">
        <div className="font-medium text-[15px] text-telemetry-text-primary">
          {preview.matchTitle}
        </div>
        <p className="text-[13px] text-telemetry-text-muted mt-0.5 m-0">
          {preview.courtAndSet}
        </p>
        <span className="inline-block text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium mt-2">
          {preview.status}
        </span>
      </div>

      <p className="text-[13px] text-telemetry-text-muted m-0">
        Você vê placar e pontos em tempo real. Não dá para editar nada.
      </p>

      <button
        type="button"
        onClick={onRedeem}
        disabled={redeeming}
        className="w-full py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {redeeming ? 'Acessando...' : 'Acompanhar partida'}
      </button>

      <Link
        href="/dashboard"
        className="text-[13px] text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors"
      >
        Agora não
      </Link>
    </div>
  );
}

