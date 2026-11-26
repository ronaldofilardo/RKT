'use client';

import { useState } from 'react';

interface ProvisionAccountModalProps {
  open: boolean;
  playerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProvisionAccountModal({ open, playerId, onClose, onSuccess }: ProvisionAccountModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ identifier: string; tempPassword: string; playerName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleProvision() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardians/me/dependents/${playerId}/provision-account`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao habilitar conta');
      setCreated(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally { setLoading(false); }
  }

  const copyCreds = () => {
    if (!created) return;
    const txt = `Acesso RKT para ${created.playerName}:\nLogin: ${created.identifier}\nSenha: ${created.tempPassword}\nLink: https://rkt.com/login`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h2 className="text-base font-bold text-telemetry-text-primary">
          {created ? '✅ Credenciais Geradas' : '🔑 Habilitar Acesso do Menor'}
        </h2>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">{error}</div>}

        {!created ? (
          <>
            <p className="text-xs text-telemetry-text-muted leading-relaxed">
              Você está gerando uma credencial individual para o menor utilizar o app RKT sob sua supervisão (ECA Digital).
            </p>
            <div>
              <label htmlFor="provision-minor-email" className="block text-xs font-medium text-telemetry-text-muted mb-1">E-mail do menor (opcional)</label>
              <input
                id="provision-minor-email"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="deixe em branco para gerar login automático"
                className="w-full border border-telemetry-border/30 rounded-lg p-2.5 text-xs bg-telemetry-base text-telemetry-text-primary"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} disabled={loading} className="px-3 py-2 text-xs text-telemetry-text-muted hover:text-telemetry-text-primary">Cancelar</button>
              <button type="button" onClick={handleProvision} disabled={loading} className="px-4 py-2 text-xs bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold rounded-lg shadow-sm">
                {loading ? 'Habilitando...' : 'Confirmar e Habilitar'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-telemetry-elevated rounded-xl border border-white/5 space-y-1.5 text-xs">
              <p>Login: <strong className="text-telemetry-text-primary font-sans tabular-nums">{created.identifier}</strong></p>
              <p>Senha temporária: <strong className="text-telemetry-text-primary font-mono">{created.tempPassword}</strong></p>
            </div>
            <p className="text-[11px] text-telemetry-text-muted">No primeiro login, o sistema exigirá a troca da senha inicial.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={copyCreds} className="px-3.5 py-2 text-xs bg-telemetry-elevated hover:bg-white/10 text-telemetry-text-primary border border-white/10 font-medium rounded-lg">
                {copied ? 'Copiado!' : 'Copiar Credenciais'}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold rounded-lg">Concluído</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
