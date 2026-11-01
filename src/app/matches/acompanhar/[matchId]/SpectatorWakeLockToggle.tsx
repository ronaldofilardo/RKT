'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  isActive: boolean;
  onToggle: () => void;
}

/**
 * Toggle visual discreto para o Screen Wake Lock do Espectador.
 * Permite que torcedores mantenham a tela acesa ou desativem para economizar bateria.
 */
export function SpectatorWakeLockToggle({ isActive, onToggle }: Props) {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && Boolean(navigator.wakeLock));
  }, []);

  if (!isSupported) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-telemetry-elevated/40 border border-telemetry-border/20 text-xs text-telemetry-text-muted select-none">
      <div className="flex items-center gap-2">
        <svg
          className={`w-4 h-4 transition-colors ${isActive ? 'text-telemetry-volt' : 'text-telemetry-text-muted'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span className="font-medium text-telemetry-text-primary">
          {isActive ? 'Tela sempre acesa' : 'Economia de bateria (tela apaga)'}
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label="Alternar manter tela acesa"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt ${
          isActive ? 'bg-telemetry-volt' : 'bg-telemetry-active'
        }`}
        title={isActive ? 'Clique para economizar bateria' : 'Clique para manter a tela ligada'}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isActive ? 'translate-x-4 bg-zinc-900' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
