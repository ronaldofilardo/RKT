"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';
import { SignupFormFields } from './signup-form-fields';
import { GestorOnboardingModal } from './gestor-onboarding-modal';

type Perfil = 'ATLETA' | 'TREINADOR' | 'GESTOR' | 'ESPECTADOR';
const PERFIL_WHITELIST: Perfil[] = ['ATLETA', 'TREINADOR', 'GESTOR', 'ESPECTADOR'];

function resolvePerfil(raw: string | null): Perfil {
  if (raw && PERFIL_WHITELIST.includes(raw as Perfil)) return raw as Perfil;
  return 'ATLETA';
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = resolvePerfil(searchParams.get('perfil'));
  const origem = searchParams.get('origem') ?? undefined;
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Perfil>(initialRole);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGestorModal, setShowGestorModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!termsAccepted) { setLoading(false); setError('Aceite os Termos de Uso e a Política de Privacidade para continuar'); return; }
    if (role === 'GESTOR') { setLoading(false); setShowGestorModal(true); return; }
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password, role, origem }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || data.error || 'Erro ao criar conta');
      else router.push('/login');
    } catch { setError('Sem conexão. Verifique sua internet e tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-telemetry-base p-4">
      <div className="bg-telemetry-card rounded-2xl shadow-xl border border-telemetry-border/10 p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><BrandLogo size="lg" priority /></div>
        <h1 className="text-2xl font-bold text-center text-telemetry-text-primary mb-2">Crie sua conta</h1>
        <p className="text-sm text-center text-telemetry-text-muted mb-6">Preencha seus dados para começar</p>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <SignupFormFields name={name} setName={setName} identifier={identifier} setIdentifier={setIdentifier} password={password} setPassword={setPassword} role={role} setRole={setRole} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />
          <button type="submit" disabled={loading} className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 mt-2 transition-colors cursor-pointer shadow-sm">
            {loading ? 'Criando conta...' : role === 'GESTOR' ? 'Avançar: cadastrar clube' : 'Criar conta'}
          </button>
          <div className="text-center text-xs text-telemetry-text-muted mt-3 border-t border-telemetry-border/10 pt-3">
            Já tem conta? <Link href="/login" className="text-telemetry-blue hover:text-telemetry-blue-light font-semibold hover:underline">Entrar</Link>
          </div>
        </form>
        <GestorOnboardingModal open={showGestorModal} onOpenChange={setShowGestorModal} />
      </div>
    </div>
  );
}
