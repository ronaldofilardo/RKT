'use client';

import { useEffect, useState } from 'react';
import type { ExternalAthlete, ExternalClub, ExternosData } from './types';
import { ExternosAthletesTable } from './externos-athletes-table';
import { ExternosClubsTable } from './externos-clubs-table';

interface ExternosSectionProps {
  data: ExternosData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ExternosSection({
  data, loading, error, onRetry,
}: ExternosSectionProps) {
  const [athletes, setAthletes] = useState<ExternalAthlete[]>([]);
  const [clubs, setClubs] = useState<ExternalClub[]>([]);

  useEffect(() => {
    if (data) {
      setAthletes(data.athletes);
      setClubs(data.clubs);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="p-0 sm:p-6 space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue"></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-0 sm:p-6 space-y-6">
        <div className="bg-telemetry-error/10 border border-telemetry-error/20 text-telemetry-error p-6 rounded-xl max-w-md">
          <h2 className="font-bold mb-2">Erro</h2>
          <p>{error}</p>
          <button onClick={onRetry} className="mt-3 text-sm text-telemetry-blue hover:underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Externos</h2>
        <p className="text-xs text-telemetry-text-muted">
          Atletas e clubes cadastrados em partidas como adversários, sem conta no sistema.
        </p>
      </div>

      <ExternosAthletesTable athletes={athletes} total={data?.totalAthletes ?? athletes.length} />
      <ExternosClubsTable clubs={clubs} athletes={athletes} total={data?.totalClubs ?? clubs.length} />
    </div>
  );
}