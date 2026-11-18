'use client';

import Link from 'next/link';
import { DependentMatchesList } from './dependent-matches-list';
import type { GuardianDependentMatchItem } from '@/app/api/guardians/me/matches/matches-read.logic';

interface TabPartidasProps {
  matches: GuardianDependentMatchItem[];
  loading: boolean;
  canOperate: boolean;
}

export function GuardianTabPartidas({ matches, loading, canOperate }: TabPartidasProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-telemetry-text-primary">
            Partidas do Menor (Supervisão)
          </h2>
          <p className="text-xs text-telemetry-text-muted">
            Histórico das partidas que o menor participou, quem anotou e status.
          </p>
        </div>

        {canOperate && (
          <Link
            href="/match/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-telemetry-blue text-white px-3 py-2 rounded-lg hover:bg-telemetry-blue/90 shadow transition-all self-start sm:self-auto"
          >
            <span>🎾</span> Anotar partida
          </Link>
        )}
      </div>

      <DependentMatchesList matches={matches} loading={loading} />
    </div>
  );
}
