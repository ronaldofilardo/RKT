'use client';

import { useState } from 'react';
import type { EntitySearchItem } from '@/app/api/entities/search/entities-search.logic';
import type { StaffIndicationInput } from '@/schemas/guardian';
import { useStaffSearch } from './use-staff-search';
import { ResponsavelStaffKind } from './responsavel-staff-kind';
import { ResponsavelStaffSearch } from './responsavel-staff-search';
import { ResponsavelStaffExternal } from './responsavel-staff-external';
import { ResponsavelStaffActions } from './responsavel-staff-actions';

interface ResponsavelStepStaffProps {
  guardianName: string;
  indication: StaffIndicationInput | null;
  /** Link assinado devolvido pelo backend após gerar o convite externo. */
  inviteUrl: string | null;
  onChange: (indication: StaffIndicationInput) => void;
  onSubmit: () => void;
  /** Conclui (ou pula) a etapa e segue para o painel do responsável. */
  onFinish: () => void;
  submitting: boolean;
}

function shareUrlFor(guardianName: string, coachName: string, inviteUrl: string): string {
  const text = `Olá, ${coachName}! ${guardianName} te indicou para acompanhar o desenvolvimento de um atleta no RKT. Aceite o convite:\n${inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Etapa 3: indica a equipe técnica do menor (pool) ou gera link de convite externo. */
export function ResponsavelStepStaff({
  guardianName,
  indication,
  inviteUrl,
  onChange,
  onSubmit,
  onFinish,
  submitting,
}: ResponsavelStepStaffProps) {
  const kind: StaffIndicationInput['kind'] = indication?.kind ?? 'CT';
  const isExternal = kind === 'EXTERNAL_COACH';
  const [query, setQuery] = useState('');
  const { items, searching } = useStaffSearch(kind as 'CT' | 'COACH', isExternal ? '' : query);

  const selectItem = (item: EntitySearchItem) => onChange({ kind: item.kind, targetId: item.id });
  const canSubmit = isExternal
    ? Boolean(indication?.coachName && indication?.coachPhone)
    : Boolean(indication?.targetId);
  const shareUrl =
    inviteUrl && indication?.coachName
      ? shareUrlFor(guardianName, indication.coachName, inviteUrl)
      : null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-telemetry-text-primary">Equipe técnica do menor (opcional)</h3>
        <p className="text-xs text-telemetry-text-muted mt-1">
          O vínculo nasce pendente: ninguém vê os dados do menor antes do aceite.
        </p>
      </div>

      <ResponsavelStaffKind kind={kind} onChange={(next) => onChange({ kind: next })} />

      {isExternal ? (
        <ResponsavelStaffExternal indication={indication ?? { kind: 'EXTERNAL_COACH' }} onChange={onChange} />
      ) : (
        <ResponsavelStaffSearch
          query={query}
          onQueryChange={setQuery}
          items={items}
          searching={searching}
          selectedId={indication?.targetId}
          onSelect={selectItem}
        />
      )}

      <ResponsavelStaffActions
        shareUrl={shareUrl}
        canSubmit={canSubmit}
        isExternal={isExternal}
        inviteGenerated={Boolean(inviteUrl)}
        submitting={submitting}
        onSubmit={onSubmit}
        onFinish={onFinish}
      />
    </div>
  );
}
