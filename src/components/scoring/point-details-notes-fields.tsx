interface NoteModeTabsProps {
  noteMode: 'text' | 'voice';
  onModeChange: (mode: 'text' | 'voice') => void;
}

export function NoteModeTabs({ noteMode, onModeChange }: NoteModeTabsProps) {
  return (
    <div className="flex rounded-xl bg-telemetry-elevated border border-white/10 p-0.5 mb-4">
      <button
        onClick={() => onModeChange('text')}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
          noteMode === 'text'
            ? 'bg-telemetry-volt text-telemetry-base shadow'
            : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
        }`}
      >
        📝 Texto
      </button>
      <button
        onClick={() => onModeChange('voice')}
        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
          noteMode === 'voice'
            ? 'bg-telemetry-volt text-telemetry-base shadow'
            : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
        }`}
      >
        🎤 Voz
      </button>
    </div>
  );
}

interface NoteTextareaProps {
  value: string;
  onChange: (value: string) => void;
}

export function NoteTextarea({ value, onChange }: NoteTextareaProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: jogador estava cansado, vento forte, etc."
        maxLength={500}
        rows={4}
        className="w-full px-3 py-2 rounded-xl bg-telemetry-elevated border border-white/15 text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt"
      />
      <p className="text-telemetry-text-muted text-xs text-right mt-1">{value.length}/500</p>
    </div>
  );
}

interface NoteFooterButtonsProps {
  hasContent: boolean;
  onSave: () => void;
  onClear: () => void;
}

export function NoteFooterButtons({ hasContent, onSave, onClear }: NoteFooterButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mt-4">
      <button
        onClick={onSave}
        className="w-full py-2.5 rounded-xl bg-telemetry-blue hover:bg-telemetry-active text-white font-bold transition-all text-sm border border-white/10"
      >
        {hasContent ? 'Guardar' : 'Fechar'}
      </button>
      {hasContent && (
        <button
          onClick={onClear}
          className="w-full py-2.5 rounded-xl bg-transparent text-telemetry-text-muted font-bold border border-white/10 hover:bg-white/10 hover:text-telemetry-text-primary transition-all text-sm"
        >
          Limpar observação
        </button>
      )}
    </div>
  );
}
