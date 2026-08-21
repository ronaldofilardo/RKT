'use client';

interface PointDetailsCloseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

export function PointDetailsCloseDialog({
  isOpen,
  onClose,
  onDiscard,
}: PointDetailsCloseDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      role="button"
      tabIndex={-1}
      aria-label="Fechar diálogo"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); }}
    >
      <div
        className="bg-[#1e293b] rounded-[20px] p-6 mx-4 w-[clamp(240px,70vw,360px)] shadow-2xl border border-white/10"
        role="dialog"
        aria-label="Confirmar descarte"
        tabIndex={-1}
      >
        <p className="text-white font-bold text-center text-lg mb-1">Descartar detalhes?</p>
        <p className="text-gray-400 dark:text-gray-500 text-center text-sm mb-5">Os dados deste ponto serão perdidos</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onDiscard(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-400/30 hover:bg-red-500/30 transition-all text-sm"
          >
            Descartar e voltar
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 text-gray-300 font-bold border border-white/10 hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            Continuar preenchendo
          </button>
        </div>
      </div>
    </div>
  );
}