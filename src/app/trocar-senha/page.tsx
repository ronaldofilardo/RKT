"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrocarSenhaForm, TrocarSenhaSuccess } from './components';

function TrocarSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const endpoint = token ? '/api/auth/reset-password' : '/api/auth/change-password';
      const payload = token ? { token, password: newPassword } : { currentPassword, newPassword, confirmPassword };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao alterar senha');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Falha de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Senha Definida</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Sua senha foi atualizada com sucesso.</p>
        <TrocarSenhaSuccess onLoginClick={() => { }} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-8 w-full max-w-md">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        {token ? 'Definir Nova Senha' : 'Trocar Senha'}
      </h1>
      <p className="text-sm text-center text-gray-500 mb-6">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Carregando...</div>}>
        <TrocarSenhaContent />
      </Suspense>
    </div>
  );
}
