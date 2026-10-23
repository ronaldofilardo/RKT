interface DoublesConfirmButtonProps {
  startingMatch: boolean;
  onConfirm: () => void;
}

export function DoublesConfirmButton({
  startingMatch,
  onConfirm,
}: DoublesConfirmButtonProps) {
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={startingMatch}
      className="w-full py-3.5 px-4 bg-telemetry-blue hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
    >
      {startingMatch ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
          <span>Iniciando Partida...</span>
        </>
      ) : (
        <span>Confirmar e Iniciar Partida</span>
      )}
    </button>
  );
}
