"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';
import { SignupFormFields } from './signup-form-fields';
import { GestorOnboardingModal } from './gestor-onboarding-modal';
import { useSignupForm, type SignupRole } from './use-signup-form';

const PERFIL_WHITELIST: SignupRole[] = ['ATLETA', 'TREINADOR', 'GESTOR', 'ESPECTADOR'];

function resolvePerfil(raw: string | null): SignupRole {
  if (raw && PERFIL_WHITELIST.includes(raw as SignupRole)) return raw as SignupRole;
  return 'ATLETA';
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useSignupForm(resolvePerfil(searchParams.get('perfil')));

  const handleGestorSuccess = () => {
    form.setShowGestorModal(false);
    router.push('/login');
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-telemetry-base p-4">
      <div className="bg-telemetry-card rounded-2xl shadow-xl border border-telemetry-border/10 p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><BrandLogo size="lg" priority /></div>
        <h1 className="text-2xl font-bold text-center text-telemetry-text-primary mb-2">Crie sua conta</h1>
        <p className="text-sm text-center text-telemetry-text-muted mb-6">Preencha seus dados para começar</p>
        {form.error && (
          <div role="alert" className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-sm rounded-lg">
            {form.error}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="flex flex-col gap-3">
          <SignupFormFields form={form} />
          <button type="submit" disabled={form.loading} className="w-full bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-3 rounded-lg disabled:opacity-50 mt-2 transition-colors cursor-pointer shadow-sm">
            {form.loading ? 'Criando conta...' : form.role === 'GESTOR' ? 'Avançar: cadastrar clube' : 'Criar conta'}
          </button>
          <div className="text-center text-xs text-telemetry-text-muted mt-3 border-t border-telemetry-border/10 pt-3">
            Já tem conta? <Link href="/login" className="text-telemetry-blue hover:text-telemetry-blue-light font-semibold hover:underline">Entrar</Link>
          </div>
        </form>
        <GestorOnboardingModal
          open={form.showGestorModal}
          onOpenChange={form.setShowGestorModal}
          onSuccess={handleGestorSuccess}
        />
      </div>
    </div>
  );
}
