import Link from 'next/link';
import type { SignupRole } from './use-signup-form';

interface SignupRoleAndTermsProps {
  role: SignupRole;
  setRole: (role: SignupRole) => void;
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
}

export function SignupRoleAndTerms({ role, setRole, termsAccepted, setTermsAccepted }: SignupRoleAndTermsProps) {
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
          <option value="ESPECTADOR">Responsável / Espectador</option>
          <option value="GESTOR">Gestor de Clube / CT</option>
        </select>
      </div>
      <div className="flex items-start gap-2 pt-1">
        <input
          id="signup-terms-checkbox"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 cursor-pointer accent-telemetry-blue"
        />
        <label htmlFor="signup-terms-checkbox" className="text-sm font-medium text-telemetry-text-primary cursor-pointer leading-snug">
          Li e aceito os{' '}
          <Link href="/termos" className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold">
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold">
            Política de Privacidade
          </Link>
        </label>
      </div>
    </>
  );
}
