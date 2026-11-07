'use client';

import { useState } from 'react';
import type { MatchData } from '@/hooks/useScoringHandlers.types';
import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

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

  if (!isOpen) return null;

  const isDoubles = match.matchType === 'DOUBLES';
  const player1 = match.player1;
  const player2 = match.player2;
  const player1Partner = match.player1Partner;
  const player2Partner = match.player2Partner;

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

  if (!isDoubles) {
    const rawServerSide =
      match.scoreState && typeof match.scoreState === 'object' && 'server' in match.scoreState
        ? (match.scoreState as { server?: string }).server
        : undefined;
    const currentServerId =
      activeServerId ?? (rawServerSide === 'player2' ? player2.id : player1.id);
    const adversary = currentServerId === player1.id ? player2 : player1;
    const currentServer = currentServerId === player1.id ? player1 : player2;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-telemetry-card border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-telemetry-volt/20 text-telemetry-volt flex items-center justify-center mx-auto text-2xl">
            🎾
          </div>
          <div>
            <h3 className="text-lg font-bold text-telemetry-text-primary">
              Inverter sacador inicial
            </h3>
            <p className="text-xs text-telemetry-text-muted mt-2 leading-relaxed">
              O primeiro saque está com <span className="text-telemetry-text-primary font-semibold">{currentServer.name}</span>. Deseja passar o saque inicial para{' '}
              <span className="text-telemetry-text-primary font-semibold">
                {adversary.name}
              </span>
              ?
            </p>
          </div>

          <div className="p-3 rounded-xl bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-left">
            <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
              <span>⚠️</span>
              <span>Atenção: ação única</span>
            </p>
            <p className="text-[11px] leading-relaxed text-telemetry-alert/90">
              A troca só pode ser realizada antes do primeiro ponto. Ao confirmar, o novo sacador será definido e não será mais possível alterar o sacador ao longo de toda a partida.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-xs font-semibold text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSelect(adversary.id)}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-telemetry-volt text-black text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-telemetry-volt/20 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar troca'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Duplas: Mostra os 4 atletas divididos por dupla
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-telemetry-card border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎾</span>
          <div>
            <h3 className="text-base font-bold text-telemetry-text-primary">
              Corrigir Sacador do Game
            </h3>
            <p className="text-xs text-telemetry-text-muted">
              Selecione o atleta que está sacando no game atual:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Dupla 1 */}
          <div className="p-3 bg-telemetry-elevated/40 rounded-xl border border-sky-500/20 space-y-2">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              Dupla 1
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleSelect(player1.id)}
                disabled={isSubmitting}
                className={`py-2 px-2.5 text-xs rounded-lg text-left transition-all flex items-center justify-between ${
                  activeServerId === player1.id
                    ? 'bg-telemetry-blue text-white font-bold ring-2 ring-telemetry-volt'
                    : 'bg-telemetry-card text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated'
                }`}
              >
                <span className="truncate">{abbreviatePlayerName(player1.name)}</span>
                {activeServerId === player1.id && (
                  <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-telemetry-volt text-black font-black uppercase">
                    Saca
                  </span>
                )}
              </button>

              {player1Partner && (
                <button
                  type="button"
                  onClick={() => handleSelect(player1Partner.id)}
                  disabled={isSubmitting}
                  className={`py-2 px-2.5 text-xs rounded-lg text-left transition-all flex items-center justify-between ${
                    activeServerId === player1Partner.id
                      ? 'bg-telemetry-blue text-white font-bold ring-2 ring-telemetry-volt'
                      : 'bg-telemetry-card text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated'
                  }`}
                >
                  <span className="truncate">{abbreviatePlayerName(player1Partner.name)}</span>
                  {activeServerId === player1Partner.id && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-telemetry-volt text-black font-black uppercase">
                      Saca
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Dupla 2 */}
          <div className="p-3 bg-telemetry-elevated/40 rounded-xl border border-emerald-500/20 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Dupla 2
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleSelect(player2.id)}
                disabled={isSubmitting}
                className={`py-2 px-2.5 text-xs rounded-lg text-left transition-all flex items-center justify-between ${
                  activeServerId === player2.id
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-telemetry-volt'
                    : 'bg-telemetry-card text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated'
                }`}
              >
                <span className="truncate">{abbreviatePlayerName(player2.name)}</span>
                {activeServerId === player2.id && (
                  <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-telemetry-volt text-black font-black uppercase">
                    Saca
                  </span>
                )}
              </button>

              {player2Partner && (
                <button
                  type="button"
                  onClick={() => handleSelect(player2Partner.id)}
                  disabled={isSubmitting}
                  className={`py-2 px-2.5 text-xs rounded-lg text-left transition-all flex items-center justify-between ${
                    activeServerId === player2Partner.id
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-telemetry-volt'
                      : 'bg-telemetry-card text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated'
                  }`}
                >
                  <span className="truncate">{abbreviatePlayerName(player2Partner.name)}</span>
                  {activeServerId === player2Partner.id && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-telemetry-volt text-black font-black uppercase">
                      Saca
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 text-xs font-semibold text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
