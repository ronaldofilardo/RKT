'use client';

import { useEffect, useState } from 'react';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';
import { MAX_FLOATING_SPECTATORS } from '@/contexts/floating-spectator.logic';
import { FloatingSpectatorWindow } from './FloatingSpectatorWindow';
import { useIsDesktop } from './use-floating-window';

/**
 * Renderiza as janelas de acompanhamento. Vive no layout raiz (Providers), então
 * continua aberto ao navegar entre páginas enquanto o usuário estiver logado.
 */
export function FloatingSpectatorHost() {
  const ctx = useFloatingSpectatorOptional();
  const isDesktop = useIsDesktop();
  const [dock, setDock] = useState<HTMLElement | null>(null);
  const limitReached = ctx?.state.limitReached ?? false;
  const dismissLimit = ctx?.dismissLimit;

  useEffect(() => {
    if (!limitReached || !dismissLimit) return;
    const t = setTimeout(dismissLimit, 4000);
    return () => clearTimeout(t);
  }, [limitReached, dismissLimit]);

  if (!ctx || (ctx.state.items.length === 0 && !limitReached)) return null;
  const { items, focusedId } = ctx.state;

  return (
    <>
      {items.map((item, index) => {
        // Celular: só uma janela expandida por vez (as demais viram pílulas).
        const expanded = !item.minimized && (isDesktop || item.matchId === focusedId);
        return (
          <FloatingSpectatorWindow
            key={item.matchId}
            item={item}
            index={index}
            expanded={expanded}
            isDesktop={isDesktop}
            zIndex={item.matchId === focusedId ? 60 : 50 + index}
            dock={dock}
            onToggle={() => ctx.toggleMinimize(item.matchId)}
            onClose={() => ctx.close(item.matchId)}
            onFocus={() => ctx.focus(item.matchId)}
          />
        );
      })}
      <div
        ref={setDock}
        className="fixed bottom-3 left-3 right-3 z-[70] flex flex-wrap justify-end gap-2 pointer-events-none pb-[env(safe-area-inset-bottom)]"
      >
        {limitReached && (
          <p role="status" className="pointer-events-auto m-0 px-3 py-2 text-xs rounded-lg bg-telemetry-card border border-telemetry-border/30 text-telemetry-text-primary shadow-lg">
            Limite de {MAX_FLOATING_SPECTATORS} partidas abertas. Feche uma para abrir outra.
          </p>
        )}
      </div>
    </>
  );
}
