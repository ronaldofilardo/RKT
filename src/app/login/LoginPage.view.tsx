import type { FormEvent } from 'react';

interface LoginPageViewProps {
  error: string | null;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginPageView({ error, isLoading, onSubmit }: LoginPageViewProps) {
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Entrar</h1>
      <p className="text-xs text-center text-gray-400 mb-4">Demo: <code className="text-gray-600">play@email.com</code> / <code className="text-gray-600">12345678</code></p>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
      <form onSubmit={onSubmit} className="flex flex-col gap-4"><LoginField id="email" label="Email" type="email" autoComplete="email" /><LoginField id="password" label="Senha" type="password" autoComplete="current-password" minLength={8} /><button type="submit" disabled={isLoading} className="w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors">{isLoading ? 'Entrando...' : 'Entrar'}</button></form>
    </div>
  </div>;
}

function LoginField({ id, label, type, autoComplete, minLength }: { id: string; label: string; type: string; autoComplete: string; minLength?: number }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={id}>{label}</label><input id={id} name={id} type={type} inputMode={type === 'email' ? 'email' : undefined} autoComplete={autoComplete} required minLength={minLength} className="w-full px-3 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" /></div>;
}
