'use client';

import { use, useState } from 'react';

export default function ResponsavelConvitePage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const { token } = use(paramsPromise);
  const [relationship, setRelationship] = useState('PAI');
  const [dataConsent, setDataConsent] = useState(true);
  const [broadcastConsent, setBroadcastConsent] = useState(true);
  const [statsConsent, setStatsConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataConsent) return setError('O consentimento de dados esportivos é obrigatório.');
    setSubmitting(true);
    setError(null);
    try {
      const purposes = ['DATA', broadcastConsent && 'BROADCAST', statsConsent && 'STATS'].filter(Boolean);
      const res = await fetch(`/api/guardians/invites/${token}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationship, purposes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao confirmar autorização.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4">
        <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="text-4xl">✅</div>
          <h1 className="text-lg font-bold">Autorização Confirmada</h1>
          <p className="text-xs text-telemetry-text-muted">Seu vínculo de responsável legal e os consentimentos foram registrados (ECA Digital e LGPD).</p>
          <a href="/login" className="inline-block bg-telemetry-blue text-white py-2 px-6 rounded-lg text-xs font-semibold hover:bg-telemetry-blue/90">Acessar o RKT</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-telemetry-border/20 pb-4 space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-telemetry-blue bg-telemetry-blue/10 px-2 py-0.5 rounded">ECA Digital • LGPD</span>
          <h1 className="text-xl font-bold">Autorização de Responsável Legal</h1>
          <p className="text-xs text-telemetry-text-muted">Confirme seu parentesco e defina as autorizações de uso do atleta menor de 18 anos.</p>
        </div>
        {error && <div className="p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-telemetry-text-muted block mb-1">Seu Grau de Parentesco</label>
            <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-xs text-telemetry-text-primary">
              <option value="PAI">Pai</option><option value="MAE">Mãe</option><option value="TUTOR_LEGAL">Tutor(a) Legal</option>
            </select>
          </div>
          <div className="space-y-2 border border-telemetry-border/30 rounded-xl p-3 bg-telemetry-elevated/30">
            <span className="text-xs font-semibold block mb-2">Finalidades de Consentimento:</span>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="mt-0.5" />
              <span><strong>Dados de Atleta (Obrigatório):</strong> Histórico esportivo e perfil no clube.</span>
            </label>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={broadcastConsent} onChange={(e) => setBroadcastConsent(e.target.checked)} className="mt-0.5" />
              <span><strong>Transmissão em Quadra:</strong> Exibição do placar e participantes.</span>
            </label>
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={statsConsent} onChange={(e) => setStatsConsent(e.target.checked)} className="mt-0.5" />
              <span><strong>Estatísticas Avançadas:</strong> Métricas de desempenho técnico.</span>
            </label>
          </div>
          <div className="bg-telemetry-alert/10 border border-telemetry-alert/30 rounded-lg p-2.5 text-[11px] text-telemetry-alert">
            ℹ️ Apenas 1 responsável legal é registrado para cada atleta menor (Monotutela Estrita).
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-telemetry-blue text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-telemetry-blue/90 disabled:opacity-50">
            {submitting ? 'Confirmando...' : 'Confirmar e Assumir Tutela'}
          </button>
        </form>
      </div>
    </main>
  );
}
