'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { PANEL_WIDTH } from './use-floating-window';

interface Props {
  title: string;
  updateText: string;
  isDesktop: boolean;
  pos: { x: number; y: number };
  zIndex: number;
  dragHandlers: HTMLAttributes<HTMLElement>;
  auto: boolean;
  onToggleAuto: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onFocus: () => void;
  children: ReactNode;
}

const btn = 'p-1.5 rounded-md text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated/60 transition-colors';

/** Janela: popup arrastável no desktop, bottom-sheet no celular. */
export function FloatingSpectatorPanel(p: Props) {
  const layout = p.isDesktop
    ? 'rounded-2xl'
    : 'inset-x-0 bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]';
  return (
    <section
      role="dialog"
      aria-label={`Acompanhamento: ${p.title}`}
      onPointerDown={p.onFocus}
      style={p.isDesktop ? { left: p.pos.x, top: p.pos.y, width: PANEL_WIDTH, zIndex: p.zIndex } : { zIndex: p.zIndex }}
      className={`fixed flex flex-col max-h-[85vh] md:max-h-[calc(100vh-96px)] bg-telemetry-card text-telemetry-text-primary border border-telemetry-border/30 shadow-2xl ${layout}`}
    >
      <header
        {...(p.isDesktop ? p.dragHandlers : {})}
        className={`flex items-center gap-1 px-3 py-2 border-b border-telemetry-border/20 select-none ${p.isDesktop ? 'cursor-move touch-none' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-medium truncate">{p.title}</p>
          <p className="m-0 text-[11px] text-telemetry-text-muted truncate">{p.updateText}</p>
        </div>
        <button
          type="button"
          onClick={p.onToggleAuto}
          aria-pressed={p.auto}
          title="Atualização automática (a cada 15 s ou mais)"
          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${p.auto ? 'border-telemetry-blue text-telemetry-blue' : 'border-telemetry-border/30 text-telemetry-text-muted'}`}
        >
          Auto
        </button>
        <button type="button" onClick={p.onRefresh} disabled={p.isRefreshing} aria-label="Atualizar" className={btn}>
          <svg className={`w-4 h-4 ${p.isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.6 9A8 8 0 0119 11M18.4 15A8 8 0 015 13" />
          </svg>
        </button>
        <button type="button" onClick={p.onMinimize} aria-label="Minimizar" className={btn}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth={2} d="M5 12h14" /></svg>
        </button>
        <button type="button" onClick={p.onClose} aria-label="Fechar" className={btn}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>
      <div className="flex flex-col gap-3 p-3 overflow-y-auto">{p.children}</div>
    </section>
  );
}
