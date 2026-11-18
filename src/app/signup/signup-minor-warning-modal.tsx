'use client';

interface SignupMinorWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResponsavel: () => void;
}

export function SignupMinorWarningModal({
  isOpen,
  onClose,
  onSelectResponsavel,
}: SignupMinorWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h2 className="text-base font-bold text-telemetry-text-primary">Atleta Menor de 18 Anos</h2>
            <p className="text-xs text-telemetry-text-muted">ECA Digital (Lei nº 15.211/2025)</p>
          </div>
        </div>

        <div className="p-3.5 bg-telemetry-elevated rounded-xl border border-white/5 space-y-2 text-xs text-telemetry-text-secondary leading-relaxed">
          <p>
            Identificamos que você tem menos de 18 anos.
          </p>
          <p>
            Por determinação legal do <strong>ECA Digital</strong> e da <strong>LGPD</strong>, o cadastro de atletas menores de idade não pode ser feito de forma autônoma e deve ser realizado pelo seu <strong>pai, mãe ou responsável legal</strong>.
          </p>
          <p className="text-amber-400/90 font-medium">
            Seu responsável criará a conta familiar e poderá supervisionar suas partidas e autorizações esportivas com total segurança.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onSelectResponsavel}
            className="w-full py-2.5 px-4 bg-telemetry-blue text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Criar Conta com meu Responsável
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-transparent border border-white/10 text-telemetry-text-muted text-xs font-medium rounded-xl hover:text-telemetry-text-primary transition-colors"
          >
            Voltar e Corrigir Data
          </button>
        </div>
      </div>
    </div>
  );
}
