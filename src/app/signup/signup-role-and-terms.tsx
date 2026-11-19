import type { SignupRole } from './use-signup-form';

interface SignupRoleAndTermsProps {
  role: SignupRole;
  setRole: (role: SignupRole) => void;
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
  onOpenTermsModal?: (tab: 'TERMOS' | 'PRIVACIDADE') => void;
}

export function SignupRoleAndTerms({
  role,
  setRole,
  termsAccepted,
  setTermsAccepted,
  onOpenTermsModal,
}: SignupRoleAndTermsProps) {
  const handleOpen = (tab: 'TERMOS' | 'PRIVACIDADE') => (e: React.MouseEvent) => {
    if (onOpenTermsModal) { e.preventDefault(); onOpenTermsModal(tab); }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!termsAccepted && onOpenTermsModal) { e.preventDefault(); onOpenTermsModal('TERMOS'); }
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (!termsAccepted && onOpenTermsModal && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onOpenTermsModal('TERMOS');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1 text-xs text-telemetry-text-muted">
        <label htmlFor="signup-role-select" className="font-medium">
          Qual é o seu perfil?
        </label>
        <select
          id="signup-role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as SignupRole)}
          className="w-full border border-telemetry-border/30 rounded-lg p-2.5 text-sm bg-telemetry-base text-telemetry-text-primary"
        >
          <option value="ATLETA">Atleta</option>
          <option value="TREINADOR">Treinador</option>
          <option value="ESPECTADOR">Espectador</option>
          <option value="RESPONSAVEL">Responsável Legal (Menor de 18 anos)</option>
          <option value="GESTOR">Gestor de Clube / CT</option>
        </select>
      </div>
      <div
        className="flex items-start gap-2 pt-1"
        onClick={!termsAccepted ? handleContainerClick : undefined}
        onKeyDown={!termsAccepted ? handleContainerKeyDown : undefined}
      >
        <input
          id="signup-terms-checkbox"
          type="checkbox"
          checked={termsAccepted}
          disabled={!termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 cursor-pointer accent-telemetry-blue disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <label
          htmlFor="signup-terms-checkbox"
          className="text-sm font-medium text-telemetry-text-primary cursor-pointer leading-snug"
        >
          Li e aceito os{' '}
          <a
            href="/termos"
            onClick={handleOpen('TERMOS')}
            className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold"
          >
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a
            href="/privacidade"
            onClick={handleOpen('PRIVACIDADE')}
            className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold"
          >
            Política de Privacidade
          </a>
          {!termsAccepted && (
            <span className="block text-[11px] text-telemetry-text-muted mt-0.5 font-normal">
              (Necessário ler ambos os documentos no modal para liberar)
            </span>
          )}
        </label>
      </div>
    </>
  );
}
