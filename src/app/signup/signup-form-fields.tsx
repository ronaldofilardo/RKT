import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';

interface SignupFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  identifier: string;
  setIdentifier: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  role: 'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR';
  setRole: (v: 'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR') => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
}

export function SignupFormFields({
  name,
  setName,
  identifier,
  setIdentifier,
  password,
  setPassword,
  role,
  setRole,
  termsAccepted,
  setTermsAccepted,
}: SignupFormFieldsProps) {
  return (
    <>
      <input
        type="text"
        placeholder="Nome completo"
        required={role !== 'GESTOR'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <input
        type="text"
        placeholder="E-mail ou CPF"
        required={role !== 'GESTOR'}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm"
      />
      <PasswordInput
        id="signup-password"
        name="password"
        placeholder="Senha (mínimo 8 caracteres)"
        required={role !== 'GESTOR'}
        minLength={role === 'GESTOR' ? undefined : 8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-3 text-sm"
      />
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <label htmlFor="signup-role-select" className="font-medium">
          Perfil principal:
        </label>
        <select
          id="signup-role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full border rounded-lg p-2.5 text-sm bg-white"
        >
          <option value="ATLETA">Atleta</option>
          <option value="TREINADOR">Treinador</option>
          <option value="ESPECTADOR">Espectador / Responsável</option>
          <option value="GESTOR">Gestor de Clube / CT</option>
        </select>
      </div>
      <div className="flex items-start gap-2 pt-1">
        <input
          id="signup-terms-checkbox"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 cursor-pointer appearance-none border-2 border-gray-400 rounded bg-white checked:bg-sky-600 checked:border-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-colors"
        />
        <label htmlFor="signup-terms-checkbox" className="text-sm font-medium text-gray-700 cursor-pointer leading-snug">
          Li e aceito os{' '}
          <Link href={"/termos" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold">
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href={"/privacidade" as any} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold">
            Política de Privacidade
          </Link>
        </label>
      </div>
    </>
  );
}
