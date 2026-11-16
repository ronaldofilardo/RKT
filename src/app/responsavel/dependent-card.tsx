'use client';

import Link from 'next/link';
import type { DependentSummary } from '@/app/api/guardians/me/dependents/dependents-read.logic';

interface DependentCardProps {
  dependent: DependentSummary;
  mutatingId: string | null;
  onToggle: (playerId: string, purpose: 'BROADCAST' | 'STATS', current: boolean) => void;
  canOperate?: boolean;
}

export function DependentCard({ dependent, mutatingId, onToggle, canOperate = false }: DependentCardProps) {
  const isBroadcasting = dependent.consents.BROADCAST;
  const isStats = dependent.consents.STATS;
  const isMutatingBroad = mutatingId === `${dependent.playerId}-BROADCAST`;
  const isMutatingStats = mutatingId === `${dependent.playerId}-STATS`;

  return (
    <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-telemetry-border/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-telemetry-text-primary">{dependent.name}</h2>
            {dependent.nickname && <span className="text-xs text-telemetry-text-muted">({dependent.nickname})</span>}
            <span className="text-[10px] uppercase font-semibold bg-telemetry-blue/10 text-telemetry-blue px-2 py-0.5 rounded">Menor</span>
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${canOperate ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {canOperate ? 'Espectador & Anotador' : 'Acompanhamento Básico'}
            </span>
          </div>
          <p className="text-xs text-telemetry-text-muted mt-1">
            CT: <strong className="text-telemetry-text-primary">{dependent.trainingCenterName}</strong> · Grau: <strong>{dependent.relation}</strong>
          </p>
        </div>
        <Link href="/historico" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-telemetry-elevated hover:bg-white/10 text-telemetry-text-primary px-3 py-2 rounded-lg border border-telemetry-border/30 transition-colors">
          <span>📜</span> Ver Partidas
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-telemetry-text-muted">Autorizações de Uso (Termo v2.0)</h3>
          <a href="/termos/responsavel" target="_blank" rel="noopener noreferrer" className="text-[11px] text-telemetry-blue hover:underline">Ver termo completo ↗</a>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-xl bg-telemetry-elevated/20 border border-telemetry-border/20">
          <div>
            <a href="/termos/responsavel#autorizacao-1-dados" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-telemetry-text-primary hover:underline">Dados Esportivos e Equipe do CT ↗</a>
            <p className="text-[11px] text-telemetry-text-muted">Permite registro de partidas pelo gestor e treinador anotador.</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">Ativo (Obrigatório)</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-telemetry-elevated/20 border border-telemetry-border/20">
          <div>
            <a href="/termos/responsavel#autorizacao-2-transmissao" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-telemetry-text-primary hover:underline">Transmissão e Compartilhamento ↗</a>
            <p className="text-[11px] text-telemetry-text-muted">Partidas transmitidas com nome anonimizado (ex.: Atleta #8F2A7B).</p>
          </div>
          <button
            type="button" disabled={isMutatingBroad}
            onClick={() => onToggle(dependent.playerId, 'BROADCAST', isBroadcasting)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isBroadcasting ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'}`}
          >
            {isMutatingBroad ? 'Salvando...' : isBroadcasting ? '✓ Autorizado' : '✕ Desativado'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-telemetry-elevated/20 border border-telemetry-border/20">
          <div>
            <a href="/termos/responsavel#autorizacao-3-pool" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-telemetry-text-primary hover:underline">Pool de Estatísticas Agregadas ↗</a>
            <p className="text-[11px] text-telemetry-text-muted">Médias e comparativos anônimos com amostra mínima de 10 jogos/atletas.</p>
          </div>
          <button
            type="button" disabled={isMutatingStats}
            onClick={() => onToggle(dependent.playerId, 'STATS', isStats)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isStats ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'}`}
          >
            {isMutatingStats ? 'Salvando...' : isStats ? '✓ Autorizado' : '✕ Desativado'}
          </button>
        </div>
      </div>
    </div>
  );
}
