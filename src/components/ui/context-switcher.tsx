'use client';

import { useState } from 'react';
import type { SessionContextOption } from '@/lib/auth-client-login';
import { purgeOfflineCaches } from '@/lib/offline-storage-purge';
import { ContextSwitcherMenu } from './context-switcher-menu';

interface ContextSwitcherProps {
  activeContextId?: string | null;
  availableContexts?: SessionContextOption[];
  onContextSwitched?: () => void;
}

export function ContextSwitcher({
  activeContextId,
  availableContexts = [],
  onContextSwitched,
}: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const hasParticular = availableContexts.some((c) => c.type === 'PARTICULAR');
  const isCoach = availableContexts.some((c) => c.role === 'TREINADOR');

  if (availableContexts.length === 0) return null;
  if (availableContexts.length === 1 && (!isCoach || hasParticular)) return null;

  const current = availableContexts.find((c) => c.id === activeContextId) || availableContexts[0];

  async function handleSwitch(contextId: string) {
    if (contextId === activeContextId) { setIsOpen(false); return; }
    setIsSwitching(true);
    try {
      const res = await fetch('/api/auth/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextId }),
      });
      if (res.ok) {
        setIsOpen(false);
        await purgeOfflineCaches();
        if (onContextSwitched) onContextSwitched();
        else window.location.reload();
      }
    } finally {
      setIsSwitching(false);
    }
  }

  async function handleActivateParticular() {
    setIsSwitching(true);
    try {
      const res = await fetch('/api/coach/particular', { method: 'POST' });
      if (res.ok) await handleSwitch('PARTICULAR');
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={isSwitching}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Trocar clube ou contexto"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-telemetry-border/20 bg-telemetry-elevated/60 text-telemetry-text-primary hover:border-telemetry-blue/40 transition-colors cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="max-w-[130px] truncate">{current?.label ?? 'Contexto'}</span>
        <svg className="w-3.5 h-3.5 text-telemetry-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ContextSwitcherMenu
          availableContexts={availableContexts}
          activeContextId={activeContextId}
          isCoach={isCoach}
          hasParticular={hasParticular}
          onSwitch={handleSwitch}
          onActivateParticular={handleActivateParticular}
        />
      )}
    </div>
  );
}
