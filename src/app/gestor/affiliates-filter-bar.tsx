'use client';

import React from 'react';
import type { AffiliatesFilterState } from './affiliates-filter.logic';
import { FilterSelect } from './affiliates-filter-select';

interface AffiliatesFilterBarProps {
  filters: AffiliatesFilterState;
  onFilterChange: <K extends keyof AffiliatesFilterState>(key: K, value: AffiliatesFilterState[K]) => void;
  onReset: () => void;
  clubs: string[];
  states: string[];
  rankingOrgs: string[];
  filteredCount: number;
  totalCount: number;
}

export function AffiliatesFilterBar({
  filters, onFilterChange, onReset, clubs, states, rankingOrgs, filteredCount, totalCount,
}: AffiliatesFilterBarProps) {
  const isFiltered = filters.search || filters.affiliation !== 'ALL' || filters.location !== 'ALL' || filters.ranking !== 'ALL';

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, @nickname, clube ou cidade..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full bg-telemetry-surface border border-telemetry-border/30 rounded-lg px-3 py-2 text-sm text-telemetry-text-primary placeholder:text-telemetry-text-muted focus:outline-none focus:border-telemetry-blue"
          />
        </div>
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button type="button" onClick={onReset} className="text-xs text-telemetry-alert hover:underline cursor-pointer px-2 py-1">
              Limpar filtros
            </button>
          )}
          <span className="text-xs text-telemetry-text-muted">
            Exibindo {filteredCount} de {totalCount} atleta{totalCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <FilterSelect label="Afiliação" value={filters.affiliation} onChange={(e) => onFilterChange('affiliation', e.target.value)}>
          <option value="ALL">Todas</option>
          <option value="WITH_CLUB">Com Clube / CT</option>
          <option value="WITH_COACH">Com Treinador</option>
          <option value="UNAFFILIATED">Avulso / Sem vínculo</option>
          {clubs.length > 0 && (
            <optgroup label="Clubes">
              {clubs.map((c) => (<option key={c} value={`CLUB:${c}`}>{c}</option>))}
            </optgroup>
          )}
        </FilterSelect>

        <FilterSelect label="Localidade" value={filters.location} onChange={(e) => onFilterChange('location', e.target.value)}>
          <option value="ALL">Todas</option>
          {states.map((st) => (<option key={st} value={`STATE:${st}`}>{st}</option>))}
          <option value="NONE">Não informada</option>
        </FilterSelect>

        <FilterSelect label="Rankings" value={filters.ranking} onChange={(e) => onFilterChange('ranking', e.target.value)}>
          <option value="ALL">Todos</option>
          <option value="WITH_RANKING">Com ranking</option>
          <option value="WITHOUT_RANKING">Sem ranking</option>
          {rankingOrgs.length > 0 && (
            <optgroup label="Entidades">
              {rankingOrgs.map((org) => (<option key={org} value={`ORG:${org}`}>{org}</option>))}
            </optgroup>
          )}
        </FilterSelect>
      </div>
    </div>
  );
}
