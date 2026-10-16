import type { Athlete } from '../atletas.types';
import { formatBirthDate, formatRankings } from './athlete-list-table.logic';

interface AthleteTableRowProps {
  athlete: Athlete;
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
}

export function AthleteTableRow({ athlete: a, onEditAthlete, onDeleteAthlete }: AthleteTableRowProps) {
  const rankingList = formatRankings(a.rankings);

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div className="font-semibold text-telemetry-text-primary">{a.name}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-white/5 ${
          a.gender === 'MALE' ? 'bg-telemetry-blue/20 text-telemetry-blue' :
          a.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-400' :
          'bg-white/5 text-telemetry-text-muted'
        }`}>
          {a.gender === 'MALE' ? 'M' : a.gender === 'FEMALE' ? 'F' : '-'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-telemetry-text-muted/90">
        {formatBirthDate(a.birthDate) || <span className="text-telemetry-text-muted/50">-</span>}
      </td>
      <td className="px-6 py-4">
        {a.age != null ? (
          <span className="text-sm font-medium text-telemetry-text-primary">{a.age} anos</span>
        ) : (
          <span className="text-telemetry-text-muted/50">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-telemetry-text-muted/90">
        {a.dominance === 'RIGHT' ? 'Destro' : a.dominance === 'LEFT' ? 'Canhoto' : <span className="text-telemetry-text-muted/50">-</span>}
      </td>
      <td className="px-6 py-4 text-sm text-telemetry-text-muted/90">
        {a.backhand === 'ONE_HANDED' ? '1 mão' : a.backhand === 'TWO_HANDED' ? '2 mãos' : <span className="text-telemetry-text-muted/50">-</span>}
      </td>
      <td className="px-6 py-4">
        {!rankingList ? (
          <span className="text-telemetry-text-muted/50 text-sm">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {rankingList.map((r, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-telemetry-volt/10 text-telemetry-volt text-xs font-medium border border-telemetry-volt/20">
                {r}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => onEditAthlete(a)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-telemetry-blue text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => onDeleteAthlete(a)}
            aria-label={`Excluir atleta ${a.name}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}
