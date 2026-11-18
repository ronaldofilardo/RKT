'use client';

import { useGuardianIndications } from './use-guardian-indications';

export function GuardianTabAvisos({ playerId }: { playerId?: string }) {
  const { data, loading } = useGuardianIndications(playerId);
  if (loading) return <div className="py-8 text-center text-xs text-telemetry-text-muted">Carregando avisos...</div>;

  const hasItems = (data?.trainingCenters.length ?? 0) > 0 || (data?.coaches.length ?? 0) > 0 || (data?.invites.length ?? 0) > 0;
  if (!hasItems) {
    return (
      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-8 text-center text-telemetry-text-muted text-sm space-y-2">
        <p>Nenhuma indicação de clube ou treinador registrada para este dependente.</p>
        <p className="text-xs">Quando você indicar um clube ou treinador no cadastro ou no app, os retornos de aceite aparecerão aqui.</p>
      </div>
    );
  }

  const badgeClass = (st: string) => st === 'ACTIVE'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : st === 'PENDING' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-telemetry-error/15 text-telemetry-error border-telemetry-error/30';

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-telemetry-text-primary">Avisos de Aceite & Solicitações</h2>
        <p className="text-xs text-telemetry-text-muted">Acompanhe se os centros de treinamento ou treinadores aceitaram vincular o menor.</p>
      </div>

      <div className="grid gap-3">
        {data?.trainingCenters.map((ct) => (
          <div key={ct.id} className="bg-telemetry-card border border-telemetry-border/30 rounded-xl p-4 flex justify-between items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-telemetry-text-primary">🏢 {ct.name}</span>
                <span className="text-[10px] text-telemetry-text-muted uppercase">Clube / CT</span>
              </div>
              <p className="text-xs text-telemetry-text-muted mt-1">
                {ct.status === 'ACTIVE' && `Aceito pelo clube em ${new Date(ct.since).toLocaleDateString('pt-BR')} — Atleta no elenco.`}
                {ct.status === 'PENDING' && `Solicitação enviada em ${new Date(ct.since).toLocaleDateString('pt-BR')} — Aguardando aceite do gestor.`}
                {ct.status === 'REJECTED' && `Indicação não aceita pelo clube.`}
                {ct.status === 'ENDED' && `Vínculo com o clube encerrado.`}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass(ct.status)}`}>
              {ct.status === 'ACTIVE' ? 'Aceito' : ct.status === 'PENDING' ? 'Pendente' : 'Recusado'}
            </span>
          </div>
        ))}

        {data?.coaches.map((c) => (
          <div key={c.id} className="bg-telemetry-card border border-telemetry-border/30 rounded-xl p-4 flex justify-between items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-telemetry-text-primary">🎾 Treinador {c.name}</span>
                <span className="text-[10px] text-telemetry-text-muted uppercase">Treinador Particular</span>
              </div>
              <p className="text-xs text-telemetry-text-muted mt-1">
                {c.status === 'ACTIVE' && 'Vínculo ativo de acompanhamento técnico.'}
                {c.status === 'PENDING' && 'Aguardando confirmação do treinador.'}
                {c.status === 'REJECTED' && 'Solicitação não aceita pelo treinador.'}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass(c.status)}`}>
              {c.status === 'ACTIVE' ? 'Aceito' : c.status === 'PENDING' ? 'Pendente' : 'Recusado'}
            </span>
          </div>
        ))}

        {data?.invites.map((inv) => (
          <div key={inv.id} className="bg-telemetry-card border border-telemetry-border/30 rounded-xl p-4 flex justify-between items-center gap-3">
            <div>
              <span className="text-sm font-bold text-telemetry-text-primary">🔗 Convite Externo: {inv.coachName || 'Treinador'}</span>
              <p className="text-xs text-telemetry-text-muted mt-1">
                {inv.usedAt ? `Convite resgatado em ${new Date(inv.usedAt).toLocaleDateString('pt-BR')}.` : `Convite enviado via WhatsApp/Link (válido até ${new Date(inv.expiresAt).toLocaleDateString('pt-BR')}).`}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              inv.usedAt ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-telemetry-blue/15 text-telemetry-blue border-telemetry-blue/30'
            }`}>
              {inv.usedAt ? 'Resgatado' : 'Link Enviado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
