"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand-logo';
import { clearAuthState } from '@/lib/auth-client';
import { TrocarSenhaForm } from './components';

function TrocarSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setError(null);
    setLoading(true);
    try {
      const endpoint = token ? '/api/auth/reset-password' : '/api/auth/change-password';
      const payload = token ? { token, password: newPassword } : { currentPassword, newPassword, confirmPassword };
      const authToken = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
      if (!token && !authToken) {
        setError('Sessão expirada. Faça login novamente para trocar a senha.');
        setLoading(false);
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao alterar senha');
      } else {
        clearAuthState();
        if (typeof window !== 'undefined') window.location.href = '/login?exit=1';
      }
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-telemetry-card rounded-2xl shadow-xl border border-telemetry-border/10 p-8 w-full max-w-md">
      <div className="flex justify-center mb-6"><BrandLogo size="lg" priority /></div>
      <h1 className="text-2xl font-bold text-center text-telemetry-text-primary mb-2">
        {token ? 'Definir Nova Senha' : 'Trocar Senha'}
      </h1>
      <p className="text-sm text-center text-telemetry-text-muted mb-6">
        {token ? 'Crie sua nova senha de acesso' : 'Informe sua senha atual e crie uma nova senha'}
      </p>
      <TrocarSenhaForm
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        error={error}
        loading={loading}
        hasToken={Boolean(token)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function TrocarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-telemetry-base p-4">
      <Suspense fallback={<div className="text-sm text-telemetry-text-muted">Carregando...</div>}>
        <TrocarSenhaContent />
      </Suspense>
    </div>
  );
}
