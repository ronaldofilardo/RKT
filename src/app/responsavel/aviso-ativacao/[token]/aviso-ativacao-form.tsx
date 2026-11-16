'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AvisoAtivacaoFormProps {
  token: string;
  minorName: string;
  guardianName: string;
}

export function AvisoAtivacaoForm({ token, minorName, guardianName }: AvisoAtivacaoFormProps) {
  const [accessMode, setAccessMode] = useState<'BASIC' | 'SPECTATOR'>('BASIC');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (password !== confirmPassword) return setError('As senhas digitadas não coincidem.');
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/guardians/invites/${token}/activate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, accessMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Falha ao ativar conta.');
      setSuccess(true);
    } catch (err: any) { setError(err.message || 'Erro inesperado.'); }
    finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="text-4xl">🎉</div>
        <h2 className="text-lg font-bold text-telemetry-text-primary">Conta Ativada com Sucesso!</h2>
        <p className="text-xs text-telemetry-text-muted">
          Olá, <strong>{guardianName}</strong>! Sua {accessMode === 'SPECTATOR' ? 'Conta de Espectador & Anotador' : 'Conta Básica de Acompanhamento'} está pronta para acompanhar <strong>{minorName}</strong>.
        </p>
        <Link href="/login" className="inline-block bg-telemetry-blue text-white py-2 px-6 rounded-lg text-xs font-semibold hover:bg-telemetry-blue/90">
          Fazer Login no RKT
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-lg">{error}</div>}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-telemetry-text-primary block">Escolha seu Modo de Acesso:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${accessMode === 'BASIC' ? 'border-telemetry-blue bg-telemetry-blue/10 ring-1 ring-telemetry-blue' : 'border-telemetry-border/30 bg-telemetry-elevated/20'}`}>
            <input type="radio" name="accessMode" value="BASIC" checked={accessMode === 'BASIC'} onChange={() => setAccessMode('BASIC')} className="sr-only" />
            <span className="text-xs font-bold block text-telemetry-text-primary">🛡️ Conta Básica</span>
            <span className="text-[11px] text-telemetry-text-muted block mt-1">Acompanhe quais partidas foram criadas e anotadas (quem e quando, sem placar). Upgrade livre no painel.</span>
          </label>
          <label className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${accessMode === 'SPECTATOR' ? 'border-telemetry-blue bg-telemetry-blue/10 ring-1 ring-telemetry-blue' : 'border-telemetry-border/30 bg-telemetry-elevated/20'}`}>
            <input type="radio" name="accessMode" value="SPECTATOR" checked={accessMode === 'SPECTATOR'} onChange={() => setAccessMode('SPECTATOR')} className="sr-only" />
            <span className="text-xs font-bold block text-telemetry-text-primary">🎾 Espectador & Anotador</span>
            <span className="text-[11px] text-telemetry-text-muted block mt-1">Placar ao vivo, transmissão, permissão de criar e anotar partidas próprias e compartilhar links.</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[11px] font-medium text-telemetry-text-muted block mb-1">Crie sua Senha (mín. 6 dígitos)</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2 text-xs text-telemetry-text-primary" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-telemetry-text-muted block mb-1">Confirme a Senha</label>
          <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2 text-xs text-telemetry-text-primary" />
        </div>
      </div>
      <button type="submit" disabled={submitting || !password} className="w-full bg-telemetry-blue text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-telemetry-blue/90 disabled:opacity-40 cursor-pointer">
        {submitting ? 'Ativando...' : 'Ativar Minha Conta de Responsável'}
      </button>
    </form>
  );
}
