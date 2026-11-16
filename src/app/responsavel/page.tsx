'use client';

import Link from 'next/link';
import { useGuardianDependents } from './use-guardian-dependents';
import { useGuardianMatches } from './use-guardian-matches';
import { DependentCard } from './dependent-card';
import { DependentMatchesList } from './dependent-matches-list';
import { GuardianUpgradeBanner } from './guardian-upgrade-banner';
import { GuardianTopBar } from './guardian-topbar';

export default function ResponsavelPage() {
  const { dependents, canOperate, loading, error, mutatingId, upgrading, toggleConsent, upgradeAccount } = useGuardianDependents();
  const { matches, loading: matchesLoading } = useGuardianMatches();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <GuardianTopBar />

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span>👪</span> Meus Dependentes
          </h2>
          <p className="text-xs text-telemetry-text-muted">
            Supervisão parental e acompanhamento de partidas sob o ECA Digital (Lei 15.211/2025) e LGPD.
          </p>
        </div>

        {error && <div className="p-4 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-xs rounded-xl">{error}</div>}

        {!loading && !canOperate && dependents.length > 0 && (
          <GuardianUpgradeBanner upgrading={upgrading} onUpgrade={upgradeAccount} />
        )}

        {loading ? (
          <div className="text-center py-12 text-telemetry-text-muted text-sm">Carregando dependentes e autorizações...</div>
        ) : dependents.length === 0 ? (
          <div className="text-center py-12 bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-8 space-y-4 shadow-md">
            <div className="text-4xl">🎾</div>
            <h2 className="text-base font-semibold">Nenhum dependente vinculado ativo</h2>
            <p className="text-xs text-telemetry-text-muted max-w-md mx-auto">
              Quando você for cadastrado como responsável legal por um CT ou aceitar um convite de tutela de um menor, os dados aparecerão aqui.
            </p>
            <Link href="/responsavel" className="inline-block text-xs font-semibold bg-telemetry-blue text-white py-2 px-5 rounded-lg hover:bg-telemetry-blue/90">
              Atualizar
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {dependents.map((dependent) => (
                <DependentCard
                  key={dependent.playerId}
                  dependent={dependent}
                  mutatingId={mutatingId}
                  onToggle={toggleConsent}
                  canOperate={canOperate}
                />
              ))}
            </div>

            <DependentMatchesList matches={matches} loading={matchesLoading} />
          </div>
        )}
      </main>
    </div>
  );
}
