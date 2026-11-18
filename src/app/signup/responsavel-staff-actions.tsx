'use client';

interface ResponsavelStaffActionsProps {
  /** Link do WhatsApp já com o convite assinado (null enquanto não gerado). */
  shareUrl: string | null;
  canSubmit: boolean;
  isExternal: boolean;
  inviteGenerated: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onFinish: () => void;
}

const BUTTON_BASE = 'flex-1 font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 cursor-pointer';

/** Rodapé da Etapa 3: pular, concluir/gerar convite e compartilhar no WhatsApp. */
export function ResponsavelStaffActions({
  shareUrl,
  canSubmit,
  isExternal,
  inviteGenerated,
  submitting,
  onSubmit,
  onFinish,
}: ResponsavelStaffActionsProps) {
  const label = submitting
    ? 'Salvando...'
    : isExternal && !inviteGenerated
      ? 'Gerar convite'
      : 'Concluir cadastro';

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onFinish}
          disabled={submitting}
          className={`${BUTTON_BASE} border border-telemetry-border/30 bg-telemetry-elevated/40 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated/70 transition-colors`}
        >
          Pular e configurar depois
        </button>
        <button
          type="button"
          onClick={isExternal && inviteGenerated ? onFinish : onSubmit}
          disabled={submitting || (!inviteGenerated && !canSubmit)}
          className={`${BUTTON_BASE} bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-sm transition-colors`}
        >
          {label}
        </button>
      </div>
      {shareUrl && (
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-[#25D366] text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90"
        >
          Compartilhar Convite no WhatsApp
        </a>
      )}
    </>
  );
}
