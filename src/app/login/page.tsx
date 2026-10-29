'use client';

import { Suspense } from 'react';
import { useLoginForm } from './use-login-form';
import { LoginFormFields } from './login-form-fields';

function LoginFormContent() {
  const { error, errorField, isLoading, submitLoginForm } = useLoginForm();

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        RKT Tennis
      </h1>
      <p className="text-sm text-center text-gray-500 mb-6">
        Acesse com seu e-mail ou CPF
      </p>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submitLoginForm} className="flex flex-col gap-4">
        <LoginFormFields errorField={errorField} />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-700 text-white font-semibold py-3 rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-gray-600 border-t pt-4">
        <a
          href="/forgot"
          className="text-sky-700 hover:text-sky-800 hover:underline font-medium text-xs"
        >
          Esqueceu sua senha?
        </a>
        <div className="text-gray-500 text-xs">
          Ainda não tem conta?{' '}
          <a
            href="/signup"
            className="text-sky-700 hover:text-sky-800 hover:underline font-semibold"
          >
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Carregando...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
