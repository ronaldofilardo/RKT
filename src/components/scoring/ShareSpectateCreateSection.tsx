'use client';

import React from 'react';
import { EyeIcon, LockIcon, ClockIcon, AlertCircleIcon } from './share-spectate.icons';

interface Props {
  matchContext?: string;
  label: string;
  loading: boolean;
  error?: string | null;
  onLabelChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ShareSpectateCreateSection({
  matchContext,
  label,
  loading,
  error,
  onLabelChange,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
          <AlertCircleIcon className="w-4 h-4 flex-none" />
          <span>{error}</span>
        </div>
      )}

      {matchContext && (
        <p className="text-[13px] text-telemetry-text-muted m-0">{matchContext}</p>
      )}

      <div>
        <label htmlFor="invite-label" className="block text-[13px] text-telemetry-text-muted mb-1">
          Rótulo do convite
        </label>
        <input
          id="invite-label"
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Pai da Ana"
          maxLength={60}
          className="w-full text-sm bg-telemetry-elevated border border-telemetry-border/15 rounded-lg px-3 py-2 text-telemetry-text-primary focus:outline-none focus:border-telemetry-volt/60"
        />
      </div>

      <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] text-telemetry-text-primary">
          <EyeIcon className="w-4 h-4 text-telemetry-text-muted flex-shrink-0" />
          <span>Quem recebe vê placar e pontos em tempo real.</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-telemetry-text-primary">
          <LockIcon className="w-4 h-4 text-telemetry-text-muted flex-shrink-0" />
          <span>Comentários, notas e áudios ficam privados.</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-telemetry-text-primary">
          <ClockIcon className="w-4 h-4 text-telemetry-text-muted flex-shrink-0" />
          <span>Acesso termina 7 dias após o fim da partida.</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Criando convite...' : error ? 'Tentar de novo' : 'Criar convite'}
      </button>
    </form>
  );
}

