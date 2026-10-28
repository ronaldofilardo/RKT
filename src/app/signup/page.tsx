"use client";

import { useState } from 'react';
import Link from 'next/link';
import { SignupFormFields } from './signup-form-fields';
import { GestorOnboardingModal } from './gestor-onboarding-modal';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR'>('ATLETA');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGestorModal, setShowGestorModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Gestor de Clube/CT usa o fluxo multi-etapas de onboarding PJ
    if (role === 'GESTOR') {
      setLoading(false);
      setShowGestorModal(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao criar conta');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Falha de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Criar Conta no RKT</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Preencha os dados para iniciar seu acesso</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center">
            <p className="font-semibold mb-2">Conta criada com sucesso!</p>
            <p className="text-sm mb-4">Você já pode entrar na plataforma com suas credenciais.</p>
            <Link href="/login" className="inline-block bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-800">
              Ir para o Login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <SignupFormFields
                name={name}
                setName={setName}
                identifier={identifier}
                setIdentifier={setIdentifier}
                password={password}
                setPassword={setPassword}
                role={role}
                setRole={setRole}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-700 text-white font-semibold py-3 rounded-lg hover:bg-sky-800 disabled:opacity-50 mt-2"
              >
                {loading ? 'Criando conta...' : 'Cadastrar'}
              </button>
              <div className="text-center text-xs text-gray-500 mt-3 border-t pt-3">
                Já possui conta? <Link href="/login" className="text-sky-700 font-semibold hover:underline">Fazer login</Link>
              </div>
            </form>
            <GestorOnboardingModal
              open={showGestorModal}
              onOpenChange={setShowGestorModal}
            />
          </>
        )}
      </div>
    </div>
  );
}
