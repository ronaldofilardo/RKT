'use client';

import { ServeInlinePanel } from './ServeInlinePanel';

interface AceDetailsInlinePanelProps {
  serveStep: 'none' | 'second';
  disabled?: boolean;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}

export function AceDetailsInlinePanel({
  serveStep,
  disabled = false,
  onConfirm,
  onCancel,
}: AceDetailsInlinePanelProps) {
  return (
    <section
      aria-label="Detalhes do ace"
      className="rounded-xl bg-telemetry-card border border-white/10 px-3 py-2 flex flex-col gap-2"
    >
      <h2 className="text-center text-[clamp(12px,1.7dvh,15px)] font-semibold tracking-tight">
        ACE
      </h2>
      <ServeInlinePanel
        action="ace"
        step={serveStep === 'second' ? 'second' : 'first'}
        disabled={disabled}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </section>
  );
}
