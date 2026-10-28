"use client";

import { useLoginForm } from './use-login-form';
import { LoginFormFields } from './login-form-fields';

export default function LoginPage() {
  const { error, isLoading, submitLoginForm } = useLoginForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          RKT Tennis
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Acesse com seu e-mail ou CPF
        </p>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={submitLoginForm} className="flex flex-col gap-4">
          <LoginFormFields />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-700 text-white font-semibold py-3 rounded-lg hover:bg-sky-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Entrando..." : "Entrar"}
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
            Ainda não tem conta?{" "}
            <a
              href="/signup"
              className="text-sky-700 hover:text-sky-800 hover:underline font-semibold"
            >
              Criar conta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
