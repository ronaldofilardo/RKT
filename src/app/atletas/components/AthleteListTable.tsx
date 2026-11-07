import type { Athlete } from '../atletas.types';
import { AthleteListEmpty } from './athlete-list-table-empty';
import { AthleteTableRow } from './athlete-list-table-row';

interface AthleteListTableProps {
  athletes: Athlete[];
  currentUserId?: string | null;
  userRole?: string | null;
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
}

export function AthleteListTable({
  athletes,
  currentUserId,
  userRole,
  onEditAthlete,
  onDeleteAthlete,
}: AthleteListTableProps) {
  if (athletes.length === 0) {
    return <AthleteListEmpty />;
  }

  return (
    <div className="bg-telemetry-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-telemetry-elevated flex justify-between items-center">
        <h2 className="text-base font-semibold text-telemetry-text-primary">Atletas Cadastrados</h2>
        <span className="text-xs text-telemetry-text-muted">{athletes.length} atleta{athletes.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-telemetry-elevated text-[11px] sm:text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">Atleta</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">Clube</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3">Cidade / UF</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Sexo</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">Idade</th>
              <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3">Perfil</th>
              <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3">Rankings</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
            {athletes.map((a) => (
              <AthleteTableRow
                key={a.id}
                athlete={a}
                currentUserId={currentUserId}
                userRole={userRole}
                onEditAthlete={onEditAthlete}
                onDeleteAthlete={onDeleteAthlete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
