'use client';

import { Suspense } from 'react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useLoginForm } from './use-login-form';
import { LoginFormFields } from './login-form-fields';
import { LoginContextSelector } from './login-context-selector';

function LoginFormContent() {
  const {
    formRef,
    error,
    errorField,
    isLoading,
    pendingContexts,
    submitLoginForm,
    selectContext,
    cancelContextSelection,
  } = useLoginForm();

  return (
    <div className="bg-telemetry-card rounded-2xl shadow-xl border border-telemetry-border/10 p-8 w-full max-w-md">
      <div className="flex justify-center mb-6">
        <BrandLogo size="lg" priority />
      </div>
      <h1 className="sr-only">RKT Tennis</h1>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {pendingContexts ? (
        <LoginContextSelector
          contexts={pendingContexts}
          isLoading={isLoading}
          onSelect={selectContext}
          onCancel={cancelContextSelection}
        />
      ) : (
        <>
          <p className="text-sm text-center text-telemetry-text-muted mb-6">
            Acesse com seu e-mail ou CPF
          </p>
          <form ref={formRef} onSubmit={submitLoginForm} className="flex flex-col gap-4">
            <LoginFormFields errorField={errorField} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-telemetry-text-muted border-t border-telemetry-border/10 pt-4">
            <a
              href="/forgot"
              className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-medium text-xs"
            >
              Esqueceu sua senha?
            </a>
            <div className="text-telemetry-text-muted text-xs">
              Ainda não tem conta?{' '}
              <a
                href="/signup"
                className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline font-semibold"
              >
                Criar conta
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-telemetry-base p-4">
      <Suspense fallback={<div className="text-sm text-telemetry-text-muted">Carregando...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
