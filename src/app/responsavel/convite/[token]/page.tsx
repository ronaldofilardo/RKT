'use client';

import { use, useState, useEffect } from 'react';
import { isValidCpf } from '@/lib/validators/cpf.validator';
import { useConviteInvite } from './use-convite-invite';
import { ConviteMinorCard } from './convite-minor-card';
import { ConviteGuardianFields } from './convite-guardian-fields';
import { ConviteConsentBoxes } from './convite-consent-boxes';

export default function ResponsavelConvitePage({ params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const { token } = use(paramsPromise);
  const { loading, inviteData, error: fetchError } = useConviteInvite(token);
  const [guardianName, setGuardianName] = useState('');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [relationship, setRelationship] = useState('PAI');
  const [dataConsent, setDataConsent] = useState(false);
  const [broadcastConsent, setBroadcastConsent] = useState(false);
  const [statsConsent, setStatsConsent] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteData?.preGuardianName) setGuardianName(inviteData.preGuardianName);
  }, [inviteData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianName.trim() || guardianName.trim().length < 3) return setError('Informe seu nome completo (mínimo 3 caracteres).');
    if (!isValidCpf(guardianCpf)) return setError('Informe um CPF válido com 11 dígitos.');
    if (!dataConsent) return setError('O consentimento de dados esportivos é obrigatório.');
    if (!declaration) return setError('A declaração de responsabilidade legal é obrigatória.');
    setSubmitting(true); setError(null);
    try {
      const purposes = ['DATA', broadcastConsent && 'BROADCAST', statsConsent && 'STATS'].filter(Boolean);
      const res = await fetch(`/api/guardians/invites/${token}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardianName, guardianCpf, relationship, purposes, termsVersion: '2.0', contentHash: 'v2.0-initial-hash' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Falha ao confirmar autorização.');
      setSuccess(true);
    } catch (err: any) { setError(err.message || 'Erro inesperado.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4"><div className="text-xs text-telemetry-text-muted">Carregando dados do convite...</div></main>;
  if (fetchError || !inviteData) return <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4"><div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 text-center space-y-3"><div className="text-3xl">⚠️</div><h1 className="text-base font-bold">Convite Indisponível</h1><p className="text-xs text-telemetry-text-muted">{fetchError || 'Convite não encontrado.'}</p></div></main>;
  if (success) {
    return (
      <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4 sm:p-6">
        <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold text-telemetry-text-primary">Autorização Confirmada com Sucesso!</h1>
          <p className="text-xs text-telemetry-text-muted">Os dados e autorizações do atleta menor <strong>{inviteData.minorName}</strong> foram registrados conforme o ECA Digital e a LGPD.</p>
          <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 text-xs text-telemetry-text-muted space-y-1.5 text-left">
            <span className="font-semibold text-telemetry-text-primary block flex items-center gap-1.5"><span>📩</span> Próximos Passos:</span>
            <p className="text-[11px] leading-relaxed">O gestor do clube logo enviará o link para o seu primeiro acesso e login no sistema. Você já pode fechar esta página com segurança.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4 sm:p-6">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="border-b border-telemetry-border/20 pb-3 space-y-1">
          <span className="text-xs uppercase tracking-wider font-semibold text-telemetry-blue bg-telemetry-blue/10 px-2 py-0.5 rounded">ECA Digital • LGPD</span>
          <h1 className="text-xl font-bold">Autorização de Responsável Legal</h1>
          <p className="text-xs text-telemetry-text-muted">Gestor e treinador da partida terão acesso aos dados. <a href="/termos/responsavel" target="_blank" rel="noopener noreferrer" className="text-telemetry-blue underline">Ler termo completo (v2.0) ↗</a></p>
        </div>
        <ConviteMinorCard minorName={inviteData.minorName} trainingCenterName={inviteData.trainingCenterName} />
        {error && <div className="p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <ConviteGuardianFields guardianName={guardianName} setGuardianName={setGuardianName} guardianCpf={guardianCpf} setGuardianCpf={setGuardianCpf} relationship={relationship} setRelationship={setRelationship} preGuardianCpfMasked={inviteData.preGuardianCpfMasked} />
          <ConviteConsentBoxes dataConsent={dataConsent} setDataConsent={setDataConsent} broadcastConsent={broadcastConsent} setBroadcastConsent={setBroadcastConsent} statsConsent={statsConsent} setStatsConsent={setStatsConsent} declaration={declaration} setDeclaration={setDeclaration} />
          <div className="bg-telemetry-alert/10 border border-telemetry-alert/30 rounded-lg p-2 text-[11px] text-telemetry-alert">ℹ️ Apenas 1 responsável legal é registrado para cada atleta menor (Monotutela Estrita). Os dados são cruzados com o cadastro do clube.</div>
          <button type="submit" disabled={submitting || !dataConsent || !declaration || !guardianName || !guardianCpf} className="w-full bg-telemetry-blue text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-telemetry-blue/90 disabled:opacity-40 cursor-pointer">
            {submitting ? 'Confirmando...' : 'Confirmar e Assumir Tutela'}
          </button>
        </form>
      </div>
    </main>
  );
}
