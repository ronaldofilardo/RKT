'use client';

import { DependentCard } from './dependent-card';
import { GuardianUpgradeBanner } from './guardian-upgrade-banner';
import type { DependentSummary } from '@/app/api/guardians/me/dependents/dependents-read.logic';

interface TabAutorizacoesProps {
  dependents: DependentSummary[];
  canOperate: boolean;
  upgrading: boolean;
  mutatingId: string | null;
  onUpgrade: () => void;
  onToggleConsent: (playerId: string, purpose: 'BROADCAST' | 'STATS', current: boolean) => void;
}

export function GuardianTabAutorizacoes({
  dependents,
  canOperate,
  upgrading,
  mutatingId,
  onUpgrade,
  onToggleConsent,
}: TabAutorizacoesProps) {
  return (
    <div className="space-y-6">
      {!canOperate && (
        <GuardianUpgradeBanner upgrading={upgrading} onUpgrade={onUpgrade} />
      )}

      <div className="space-y-4">
        {dependents.map((dependent) => (
          <DependentCard
            key={dependent.playerId}
            dependent={dependent}
            mutatingId={mutatingId}
            onToggle={onToggleConsent}
            canOperate={canOperate}
          />
        ))}
      </div>
    </div>
  );
}
