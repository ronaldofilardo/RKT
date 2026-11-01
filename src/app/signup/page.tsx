"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';
import { SignupFormFields } from './signup-form-fields';
import { GestorOnboardingModal } from './gestor-onboarding-modal';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ATLETA' | 'TREINADOR' | 'ESPECTADOR' | 'GESTOR'>('ATLETA');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGestorModal, setShowGestorModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
        router.push('/login');
      }
    } catch {
      setError('Falha de conexão com o servidor');
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
        <h1 className="text-2xl font-bold text-center text-telemetry-text-primary mb-2">Criar Conta no RKT</h1>
        <p className="text-sm text-center text-telemetry-text-muted mb-6">Preencha os dados para iniciar seu acesso</p>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm rounded-lg">{error}</div>}
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
            className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 mt-2 transition-colors cursor-pointer shadow-sm"
          >
            {loading ? 'Processando...' : role === 'GESTOR' ? 'Avançar para Cadastro de Clube' : 'Cadastrar'}
          </button>
          <div className="text-center text-xs text-telemetry-text-muted mt-3 border-t border-telemetry-border/10 pt-3">
            Já possui conta? <Link href="/login" className="text-telemetry-blue hover:text-telemetry-blue-light font-semibold hover:underline">Fazer login</Link>
          </div>
        </form>
        <GestorOnboardingModal
          open={showGestorModal}
          onOpenChange={setShowGestorModal}
        />
      </div>
    </div>
  );
}
