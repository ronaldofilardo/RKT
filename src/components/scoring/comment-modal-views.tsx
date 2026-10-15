'use client';

interface CommentSubmittingOverlayProps {
  title?: string;
  description?: string;
}

/** Overlay de envio em andamento sobre o modal de comentário. */
export function CommentSubmittingOverlay({
  title = 'Salvando comentário...',
  description = 'Aguarde um instante enquanto registramos o seu comentário.',
}: CommentSubmittingOverlayProps) {
  return (
    <div
      className="absolute inset-0 bg-[#1e293b]/95 backdrop-blur-sm rounded-[20px] flex flex-col items-center justify-center gap-3 z-50 p-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <h4 className="text-white font-bold text-base">{title}</h4>
      <p className="text-telemetry-text-muted text-xs text-center leading-relaxed">{description}</p>
    </div>
  );
}

interface CommentTextInputProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  text: string;
  maxChars: number;
  onChange: (val: string) => void;
}

/** Campo de texto do comentário com contador de caracteres. */
export function CommentTextInput({ textareaRef, text, maxChars, onChange }: CommentTextInputProps) {
  return (
    <div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: mudança de estratégia, condição do jogador, etc."
        maxLength={maxChars}
        rows={4}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-telemetry-text-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p className="text-telemetry-text-muted text-xs text-right mt-1">{text.length}/{maxChars}</p>
    </div>
  );
}
