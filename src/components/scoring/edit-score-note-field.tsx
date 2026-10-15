'use client';

interface EditScoreNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Campo opcional para o motivo da correção do placar. */
export function EditScoreNoteField({ value, onChange }: EditScoreNoteFieldProps) {
  return (
    <div className="space-y-1.5 pt-2 border-t border-white/5">
      <label htmlFor="edit-score-note" className="text-xs font-medium text-telemetry-text-muted">
        Motivo da correção (opcional)
      </label>
      <input
        id="edit-score-note"
        type="text"
        maxLength={500}
        placeholder="Ex.: Correção de placar após verificação com o árbitro"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-telemetry-elevated border border-white/10 rounded-lg text-telemetry-text-primary placeholder:text-telemetry-text-muted/50 focus:outline-none focus:border-telemetry-volt transition-colors"
      />
    </div>
  );
}
