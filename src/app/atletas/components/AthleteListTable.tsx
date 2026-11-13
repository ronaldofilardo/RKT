import type { Athlete } from '../atletas.types';
import { AthleteTable } from '@/components/athlete/athlete-table';
import type { AthleteTableRowData } from '@/components/athlete/athlete-table.types';
import { computeAthleteAge } from '@/lib/athlete-labels.logic';
import { AthleteListEmpty } from './athlete-list-table-empty';
import { toAthleteListRow } from './athlete-list-row-data';

interface AthleteListTableProps {
  athletes: Athlete[];
  currentUserId?: string | null;
  userRole?: string | null;
  isClubCoach?: boolean;
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
  onGenerateLink?: (athlete: Athlete) => void;
  loadingLinkId?: string | null;
}

export function AthleteListTable({
  athletes, currentUserId, userRole, isClubCoach,
  onEditAthlete, onDeleteAthlete, onGenerateLink, loadingLinkId,
}: AthleteListTableProps) {
  if (athletes.length === 0) {
    return <AthleteListEmpty />;
  }

  const byId = new Map(athletes.map((a) => [a.id, a]));

  const actions = (row: AthleteTableRowData) => {
    const a = byId.get(row.id);
    if (!a) return { onEdit: () => {}, onDelete: () => {} };

    const age = computeAthleteAge(a.birthDate, a.age);
    const isUnder18 = age != null && age < 18;
    const isCreator = !a.createdByUserId || (currentUserId ? a.createdByUserId === currentUserId : true);
    const canDelete = !isClubCoach && (isCreator || userRole === 'ADMIN');

    return {
      onEdit: () => onEditAthlete(a),
      onDelete: () => onDeleteAthlete(a),
      onGenerateLink: onGenerateLink ? () => onGenerateLink(a) : undefined,
      loadingLink: loadingLinkId === a.id,
      canDelete,
      isClubCoach,
      isUnder18,
      hasAccount: Boolean(a.user),
    };
  };

  return (
    <div className="bg-telemetry-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
      <div className="px-4 py-3 sm:px-6 sm:py-4 bg-telemetry-elevated flex justify-between items-center">
        <h2 className="text-base font-semibold text-telemetry-text-primary">Atletas Cadastrados</h2>
        <span className="text-xs text-telemetry-text-muted">
          {athletes.length} atleta{athletes.length !== 1 ? 's' : ''}
        </span>
      </div>
      <AthleteTable athletes={athletes.map(toAthleteListRow)} actions={actions} />
    </div>
  );
}
