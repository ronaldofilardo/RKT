"use client";

import { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

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
      setError('Sem conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-telemetry-base p-4">
      <div className="bg-telemetry-card rounded-2xl shadow-xl border border-telemetry-border/10 p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo size="lg" priority />
        </div>
        <h1 className="text-2xl font-bold text-center text-telemetry-text-primary mb-2">Esqueceu sua senha?</h1>
        <p className="text-sm text-center text-telemetry-text-muted mb-6">Informe o e-mail ou CPF da sua conta</p>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm rounded-lg">{error}</div>}
        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-center">
            <p className="font-semibold mb-2">Pronto! Verifique seu contato</p>
            <p className="text-xs mb-4 text-telemetry-text-muted">Se encontrarmos sua conta, você receberá um link para criar uma nova senha em breve.</p>
            <Link href="/login" className="inline-block bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-2 px-6 rounded-lg text-sm transition-colors">
              Ir para login
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
              className="w-full border border-telemetry-border/20 bg-telemetry-elevated/40 text-telemetry-text-primary rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-telemetry-blue"
            />
            <input
              type="text"
              placeholder="WhatsApp ou telefone (opcional)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full border border-telemetry-border/20 bg-telemetry-elevated/40 text-telemetry-text-primary rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-telemetry-blue"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 mt-2 text-sm transition-colors cursor-pointer shadow-sm"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <div className="text-center text-xs text-telemetry-text-muted mt-3 border-t border-telemetry-border/10 pt-3">
              Lembrou a senha? <Link href="/login" className="text-telemetry-blue hover:text-telemetry-blue-light font-semibold hover:underline">Voltar ao login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
