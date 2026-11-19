'use client';

import type { ClubMatchGroup } from './group-club-matches.logic';
import type { ClubMatchItem } from './types';

interface GroupDesigneesProps {
  group: ClubMatchGroup;
  assignTarget: ClubMatchItem | null;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
  currentUserId?: string;
}

export function ClubMatchGroupDesignees({
  group,
  assignTarget,
  onAssignCoach,
  onAnnotate,
  currentUserId,
}: GroupDesigneesProps) {
  const coaches = group.template?.assignedCoaches ?? group.source?.assignedCoaches ?? [];
  const legacyCoach = group.template?.assignedCoach ?? group.source?.assignedCoach;

  const designees = coaches.length > 0
    ? coaches.map((ac) => {
        const found = group.matches.find((m) => m.createdByUserId === ac.coach.id);
        const stateLabel = found
          ? found.state === 'IN_PROGRESS'
            ? 'Em andamento'
            : found.state === 'FINISHED'
            ? 'Finalizada'
            : 'Agendada'
          : 'Aguardando início';
        return { id: ac.coach.id, name: ac.coach.name, stateLabel, hasStarted: Boolean(found) };
      })
    : legacyCoach
    ? [{
        id: legacyCoach.id,
        name: legacyCoach.name,
        stateLabel: group.matches.some((m) => m.createdByUserId === legacyCoach.id) ? 'Em andamento' : 'Aguardando início',
        hasStarted: group.matches.some((m) => m.createdByUserId === legacyCoach.id),
      }]
    : [];

  const hasMyAnnotation = Boolean(currentUserId && group.matches.some((m) => m.createdByUserId === currentUserId));

  return (
    <div className="flex flex-wrap items-center gap-3 font-normal text-telemetry-text-muted text-xs">
      {designees.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-telemetry-text-primary">Designados:</span>
          {designees.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[11px]"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${d.hasStarted ? 'bg-telemetry-volt' : 'bg-telemetry-text-muted/60'}`} />
              <strong className="text-telemetry-blue-light font-medium">{d.name}</strong>
              <span className="text-[10px] text-telemetry-text-muted">({d.stateLabel})</span>
            </span>
          ))}
        </div>
      ) : (
        <span className="text-telemetry-text-muted italic">Nenhum treinador designado</span>
      )}

      {onAssignCoach && assignTarget && (
        <button
          type="button"
          onClick={() => onAssignCoach(assignTarget)}
          className="text-xs text-telemetry-blue-light hover:underline font-semibold cursor-pointer"
        >
          Designar treinadores
        </button>
      )}

      {onAnnotate && assignTarget && !hasMyAnnotation && (
        <button
          type="button"
          onClick={() => onAnnotate(assignTarget)}
          className="px-2 py-1 rounded bg-telemetry-volt/15 border border-telemetry-volt/30 text-telemetry-volt text-[11px] font-semibold hover:bg-telemetry-volt/25 transition-colors cursor-pointer"
        >
          + Anotar pelo clube
        </button>
      )}
    </div>
  );
}
