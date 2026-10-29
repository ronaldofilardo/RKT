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
          className="block text-sm font-medium text-gray-700 mb-1"
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
          className={`w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            isIdentifierError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
              : 'border-telemetry-border/30 focus:border-telemetry-blue focus:ring-telemetry-blue/20'
          }`}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
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
