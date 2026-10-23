'use client';

interface CommentModeTabsProps {
  mode: 'text' | 'voice';
  onChange: (mode: 'text' | 'voice') => void;
}

export function CommentModeTabs({ mode, onChange }: CommentModeTabsProps) {
  const tabClass = (active: boolean, activeBg: string) =>
    `flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
      active
        ? `${activeBg} text-white shadow`
        : 'text-telemetry-text-muted hover:text-white'
    }`;

  return (
    <div role="tablist" aria-label="Modo de comentário" className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 mb-4">
      <button
        role="tab"
        aria-selected={mode === 'text'}
        onClick={() => onChange('text')}
        className={tabClass(mode === 'text', 'bg-blue-600')}
      >
        📝 Texto
      </button>
      <button
        role="tab"
        aria-selected={mode === 'voice'}
        onClick={() => onChange('voice')}
        className={tabClass(mode === 'voice', 'bg-green-600')}
      >
        🎤 Voz
      </button>
    </div>
  );
}
