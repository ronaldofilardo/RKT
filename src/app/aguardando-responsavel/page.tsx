'use client';

import { useState } from 'react';

export default function AguardandoResponsavelPage() {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/minors/me/guardian-invite', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao gerar convite.');
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setInviteUrl(`${origin}/responsavel/convite/${data.token}`);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">⏳</div>
          <h1 className="text-xl font-bold">Aguardando Autorização do Responsável</h1>
          <p className="text-xs text-telemetry-text-muted">
            Por você ser menor de 18 anos, as normas de proteção à criança e adolescente (ECA Digital e LGPD) exigem a confirmação de um responsável legal.
          </p>
        </div>

        <div className="bg-telemetry-alert/10 border border-telemetry-alert/30 rounded-xl p-3.5 space-y-1 text-xs text-telemetry-alert">
          <p className="font-semibold">⚠️ Regra de Responsável Único</p>
          <p className="text-[11px] text-telemetry-text-muted">
            Apenas 1 responsável legal pode ser cadastrado. Ao gerar este link, certifique-se de enviá-lo para seu pai, mãe ou tutor legal.
          </p>
        </div>

        {error && <div className="p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-lg">{error}</div>}

        {inviteUrl ? (
          <div className="space-y-3 bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-4">
            <span className="text-xs font-semibold text-telemetry-text-primary block">Link de Convite Gerado:</span>
            <input readOnly value={inviteUrl} className="w-full bg-telemetry-base border border-telemetry-border/20 rounded p-2 text-xs font-mono select-all" />
            <button onClick={handleCopy} className="w-full bg-telemetry-blue text-white py-2 px-4 rounded-lg text-xs font-semibold hover:bg-telemetry-blue/90">
              {copied ? 'Link Copiado!' : 'Copiar Link para Enviar pelo WhatsApp'}
            </button>
            <p className="text-[11px] text-telemetry-text-muted text-center">Válido por 7 dias. Envie diretamente ao seu responsável.</p>
          </div>
        ) : (
          <button onClick={handleGenerateInvite} disabled={loading} className="w-full bg-telemetry-blue text-white font-semibold py-2.5 px-4 rounded-lg text-sm hover:bg-telemetry-blue/90 disabled:opacity-50">
            {loading ? 'Gerando Link...' : 'Gerar Convite para meu Responsável'}
          </button>
        )}

        <div className="pt-2 border-t border-telemetry-border/20 flex justify-between items-center text-xs text-telemetry-text-muted">
          <span>RKT Proteção ao Menor</span>
          <a href="/login" className="hover:text-telemetry-text-primary underline">Sair da conta</a>
        </div>
      </div>
    </main>
  );
}
