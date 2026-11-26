'use client';

interface PointAnnotationCancelRowProps {
  isSelectWinner: boolean;
  onCancel: () => void;
}

/** Instrução + botão de cancelar a anotação em andamento. */
export function PointAnnotationCancelRow({ isSelectWinner, onCancel }: PointAnnotationCancelRowProps) {
  return (
    <div className={`flex items-center gap-2 px-1 ${isSelectWinner ? 'justify-between' : 'justify-center'}`}>
      {isSelectWinner && (
        <p role="status" className="text-[clamp(11px,1.5dvh,13px)] font-semibold text-telemetry-volt truncate">
          Toque no card do jogador que venceu o ponto
        </p>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 rounded-lg border border-white/10 bg-transparent px-3 py-0.5 text-[clamp(9.5px,1.3dvh,11px)] text-telemetry-text-muted transition-colors hover:bg-white/5 whitespace-nowrap"
      >
        Cancelar anotação
      </button>
    </div>
  );
}
