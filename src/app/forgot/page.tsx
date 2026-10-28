"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, contact: contact || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao solicitar recuperação');
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
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Recuperar Senha</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Informe seu e-mail ou CPF cadastrado</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center">
            <p className="font-semibold mb-2">Solicitação enviada!</p>
            <p className="text-xs mb-4 text-emerald-700">Se o usuário existir, a equipe de suporte emitirá o link de redefinição seguro.</p>
            <Link href="/login" className="inline-block bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-800 text-sm">
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Seu e-mail ou CPF"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
            />
            <input
              type="text"
              placeholder="WhatsApp ou telefone para contato (opcional)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-700 text-white font-semibold py-3 rounded-lg hover:bg-sky-800 disabled:opacity-50 mt-2 text-sm"
            >
              {loading ? 'Enviando...' : 'Solicitar Recuperação'}
            </button>
            <div className="text-center text-xs text-gray-500 mt-3 border-t pt-3">
              Lembrou a senha? <Link href="/login" className="text-sky-700 font-semibold hover:underline">Voltar ao login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
