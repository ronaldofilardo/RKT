'use client';

import { Suspense } from 'react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useLoginForm } from './use-login-form';
import { LoginFormFields } from './login-form-fields';
import { LoginContextSelector } from './login-context-selector';
import { LoginErrorAlert, PasswordChangeNotice } from './login-alerts';

function LoginFormContent() {
  const {
    formRef,
    error,
    errorField,
    isLoading,
    pendingContexts,
    passwordChangeNotice,
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

      {error && <LoginErrorAlert message={error} />}

      {passwordChangeNotice && <PasswordChangeNotice />}

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
            Entre com e-mail ou CPF
          </p>
          <form ref={formRef} onSubmit={submitLoginForm} className="flex flex-col gap-4">
            <LoginFormFields errorField={errorField} />

            <button
              type="submit"
              disabled={isLoading || passwordChangeNotice}
              className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {passwordChangeNotice ? 'Redirecionando...' : isLoading ? 'Entrando...' : 'Entrar'}
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
              Novo no RKT?{' '}
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
      <Suspense fallback={<div className="text-sm text-telemetry-text-muted">Carregando login...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
