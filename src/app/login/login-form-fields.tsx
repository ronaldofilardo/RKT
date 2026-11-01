'use client';

import { PasswordInput } from '@/components/ui/password-input';

interface LoginFormFieldsProps {
  errorField?: 'identifier' | 'password' | 'both' | null;
}

export function LoginFormFields({ errorField }: LoginFormFieldsProps) {
  const isIdentifierError = errorField === 'identifier' || errorField === 'both';
  const isPasswordError = errorField === 'password' || errorField === 'both';

  return (
    <>
      <div>
        <label
          className="block text-sm font-medium text-telemetry-text-primary mb-1"
          htmlFor="identifier"
        >
          E-mail ou CPF
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="ex: usuario@email.com ou 123.456.789-00"
          required
          className={`w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-telemetry-elevated/40 text-telemetry-text-primary placeholder:text-telemetry-text-muted/60 ${
            isIdentifierError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-500/10'
              : 'border-telemetry-border/20 focus:border-telemetry-blue focus:ring-telemetry-blue/20'
          }`}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-telemetry-text-primary mb-1"
          htmlFor="password"
        >
          Senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          required
          error={isPasswordError}
        />
      </div>
    </>
  );
}
