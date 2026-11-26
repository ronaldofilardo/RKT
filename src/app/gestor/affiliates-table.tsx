'use client';

import { useState, useMemo, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { AffiliateAthleteItem } from './affiliates.types';
import { AffiliatesRow } from './affiliates-row';
import { AffiliatesMobileCard } from './affiliates-mobile-card';
import { AffiliatesFilterBar } from './affiliates-filter-bar';
import {
  INITIAL_AFFILIATES_FILTERS,
  extractUniqueClubs,
  extractUniqueStates,
  extractUniqueRankingOrgs,
  filterAffiliateAthletes,
  type AffiliatesFilterState,
} from './affiliates-filter.logic';

interface AffiliatesTableProps {
  athletes: AffiliateAthleteItem[];
  loading?: boolean;
}

export function AffiliatesTable({ athletes, loading }: AffiliatesTableProps) {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<AffiliatesFilterState>(INITIAL_AFFILIATES_FILTERS);

  const clubs = useMemo(() => extractUniqueClubs(athletes), [athletes]);
  const states = useMemo(() => extractUniqueStates(athletes), [athletes]);
  const rankingOrgs = useMemo(() => extractUniqueRankingOrgs(athletes), [athletes]);

  const filtered = useMemo(
    () => filterAffiliateAthletes(athletes, filters),
    [athletes, filters],
  );

  const handleFilterChange = useCallback(
    <K extends keyof AffiliatesFilterState>(key: K, value: AffiliatesFilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFilters(INITIAL_AFFILIATES_FILTERS);
  }, []);

  return (
    <div className="space-y-4">
      <AffiliatesFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        clubs={clubs}
        states={states}
        rankingOrgs={rankingOrgs}
        filteredCount={filtered.length}
        totalCount={athletes.length}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-telemetry-text-muted">Carregando atletas...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-telemetry-text-muted">Nenhum atleta encontrado.</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((athlete) => <AffiliatesMobileCard key={athlete.id} athlete={athlete} />)}
        </div>
      ) : (
        <div className="bg-telemetry-surface/40 border border-telemetry-border/20 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-telemetry-border/20 bg-telemetry-surface/60 text-xs text-telemetry-text-muted uppercase">
                <th className="py-2.5 px-4 font-semibold">Atleta</th>
                <th className="py-2.5 px-4 font-semibold">Afiliação (Clube / Treinador)</th>
                <th className="py-2.5 px-4 font-semibold">Dados Técnicos</th>
                <th className="py-2.5 px-4 font-semibold">Localidade / Ranking</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((athlete) => <AffiliatesRow key={athlete.id} athlete={athlete} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
