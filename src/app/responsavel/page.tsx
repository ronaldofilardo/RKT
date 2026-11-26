'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuardianDependents } from './use-guardian-dependents';
import { useGuardianMatches } from './use-guardian-matches';
import { GuardianTopBar } from './guardian-topbar';
import { GuardianTabsNav, type GuardianTab } from './guardian-tabs-nav';
import { GuardianTabAutorizacoes } from './guardian-tab-autorizacoes';
import { GuardianTabPartidas } from './guardian-tab-partidas';
import { GuardianTabAvisos } from './guardian-tab-avisos';
import { GuardianTabAcessos } from './guardian-tab-acessos';
import { GuardianTabAjuda } from './guardian-tab-ajuda';

export default function ResponsavelPage() {
  const [tab, setTab] = useState<GuardianTab>('autorizacoes');
  const { dependents, canOperate, loading, error, mutatingId, upgrading, toggleConsent, upgradeAccount } = useGuardianDependents();
  const { matches, loading: matchesLoading } = useGuardianMatches();

  const primaryPlayerId = dependents[0]?.playerId;

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <GuardianTopBar canOperate={canOperate} />

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span>👪</span> Meus Dependentes
          </h2>
          <p className="text-xs text-telemetry-text-muted">
            Supervisão parental e acompanhamento sob o ECA Digital (Lei 15.211/2025) e LGPD.
          </p>
        </div>

        {error && <div className="p-4 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-xl">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-telemetry-text-muted text-sm">Carregando dados do responsável...</div>
        ) : (
          <div className="space-y-6">
            <GuardianTabsNav currentTab={tab} onSelectTab={setTab} matchesCount={matches.length} />

            {tab === 'ajuda' ? (
              <GuardianTabAjuda />
            ) : dependents.length === 0 ? (
              <div className="text-center py-12 bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-8 space-y-4 shadow-md">
                <div className="text-4xl">🎾</div>
                <h2 className="text-base font-semibold">Nenhum dependente vinculado ativo</h2>
                <p className="text-xs text-telemetry-text-muted max-w-md mx-auto">
                  Quando você for cadastrado como responsável legal por um CT ou cadastrar um dependente, ele aparecerá aqui.
                </p>
                <Link href="/responsavel" className="inline-block text-xs font-semibold bg-telemetry-blue text-white py-2 px-5 rounded-lg hover:bg-telemetry-blue/90">
                  Atualizar
                </Link>
              </div>
            ) : (
              <>
                {tab === 'autorizacoes' && (
                  <GuardianTabAutorizacoes
                    dependents={dependents} canOperate={canOperate} upgrading={upgrading}
                    mutatingId={mutatingId} onUpgrade={upgradeAccount} onToggleConsent={toggleConsent}
                  />
                )}
                {tab === 'partidas' && <GuardianTabPartidas matches={matches} loading={matchesLoading} canOperate={canOperate} />}
                {tab === 'avisos' && <GuardianTabAvisos playerId={primaryPlayerId} />}
                {tab === 'acessos' && <GuardianTabAcessos playerId={primaryPlayerId} />}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
