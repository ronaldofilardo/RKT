import type { Athlete } from '../atletas.types';
import { formatRankings } from './athlete-list-table.logic';
import { AthleteRowActions } from './athlete-row-actions';

interface AthleteTableRowProps {
  athlete: Athlete;
  currentUserId?: string | null;
  userRole?: string | null;
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
  onGenerateLink?: (athlete: Athlete) => void;
  loadingLinkId?: string | null;
}

export function AthleteTableRow({
  athlete: a,
  currentUserId,
  userRole,
  onEditAthlete,
  onDeleteAthlete,
  onGenerateLink,
  loadingLinkId,
}: AthleteTableRowProps) {
  const rankingList = formatRankings(a.rankings);
  const location = [a.city, a.state].filter(Boolean).join(' - ');
  const clubDisplay = a.club || a.clubName;
  const isCreator = !a.createdByUserId || (currentUserId ? a.createdByUserId === currentUserId : true);
  const canDelete = isCreator || userRole === 'ADMIN';

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="font-semibold text-telemetry-text-primary">{a.name}</div>
        <div className="text-[11px] text-telemetry-text-muted/80 md:hidden">
          {[
            a.dominance === 'RIGHT' ? 'Destro' : a.dominance === 'LEFT' ? 'Canhoto' : null,
            a.backhand === 'ONE_HANDED' ? '1 mão' : a.backhand === 'TWO_HANDED' ? '2 mãos' : null,
          ].filter(Boolean).join(' · ')}
        </div>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-telemetry-text-muted font-medium">
        {clubDisplay || <span className="text-telemetry-text-muted/50">—</span>}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-telemetry-text-muted">
        {location || <span className="text-telemetry-text-muted/50">—</span>}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-white/5 ${
          a.gender === 'MALE' ? 'bg-telemetry-blue/20 text-telemetry-blue' :
          a.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-400' :
          'bg-white/5 text-telemetry-text-muted'
        }`}>
          {a.gender === 'MALE' ? 'M' : a.gender === 'FEMALE' ? 'F' : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-center text-telemetry-text-primary font-medium">
        {a.age != null ? (
          <span className="text-sm font-medium text-telemetry-text-primary">{a.age} anos</span>
        ) : (
          <span className="text-telemetry-text-muted/50">—</span>
        )}
      </td>
      <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 text-telemetry-text-muted text-xs">
        <div>{a.dominance === 'RIGHT' ? 'Destro' : a.dominance === 'LEFT' ? 'Canhoto' : '-'}</div>
        <div className="text-[11px] text-telemetry-text-muted/70">{a.backhand === 'ONE_HANDED' ? '1 mão' : a.backhand === 'TWO_HANDED' ? '2 mãos' : ''}</div>
      </td>
      <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3">
        {!rankingList ? (
          <span className="text-telemetry-text-muted/50 text-xs">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {rankingList.map((r, i) => (
              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-telemetry-volt/10 text-telemetry-volt text-[10px] font-medium border border-telemetry-volt/20">
                {r}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right">
        <AthleteRowActions
          athlete={a}
          canDelete={canDelete}
          onEdit={() => onEditAthlete(a)}
          onDelete={() => onDeleteAthlete(a)}
          onGenerateLink={onGenerateLink}
          loadingLink={loadingLinkId === a.id}
        />
      </td>
    </tr>
  );
}
