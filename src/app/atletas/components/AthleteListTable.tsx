import type { Athlete } from '../atletas.types';
import { AthleteListEmpty } from './athlete-list-table-empty';
import { AthleteTableRow } from './athlete-list-table-row';

interface AthleteListTableProps {
  athletes: Athlete[];
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
}

export function AthleteListTable({ athletes, onEditAthlete, onDeleteAthlete }: AthleteListTableProps) {
  if (athletes.length === 0) {
    return <AthleteListEmpty />;
  }

  return (
    <div className="bg-telemetry-card rounded-xl shadow-sm border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 bg-telemetry-elevated">
        <h2 className="text-base font-semibold text-telemetry-text-primary">Atletas Cadastrados</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-telemetry-elevated">
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Nome</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Sexo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Nascimento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Idade</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Dominância</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Backhand</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Rankings</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {athletes.map((a) => (
              <AthleteTableRow key={a.id} athlete={a} onEditAthlete={onEditAthlete} onDeleteAthlete={onDeleteAthlete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
