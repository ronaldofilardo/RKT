'use client';

import { ServeInlinePanel } from './ServeInlinePanel';

interface AceDetailsModalProps {
  isOpen: boolean;
  serveStep: 'none' | 'second';
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}

export function AceDetailsModal({
  isOpen,
  serveStep,
  onConfirm,
  onCancel,
}: AceDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-telemetry-card p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Detalhes do Ace</h2>
        <ServeInlinePanel
          action="ace"
          step={serveStep === 'second' ? 'second' : 'first'}
          disabled={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
