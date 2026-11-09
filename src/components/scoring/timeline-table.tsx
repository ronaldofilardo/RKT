// ste-exception R-03: Linha de resultado final com vencedor e placar formatado; lógica de agrupamento de sets mantida coesa com timeline-set-results.
'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import type { TennisFormat } from '@/lib/match-config-types';
import { getInitialGames } from '@/core/scoring/format-rules';
import { SetGroup } from './timeline-rows';
import { TimelineTableHead } from './timeline-table-head';
import { getSetResults } from './timeline-set-results';

import type { TimelineDoublesConfig } from './timeline-row.logic';

interface TimelineTableProps {
  groupedBySet: { setNumber: number; points: TimelinePoint[] }[];
  points: TimelinePoint[];
  hasActiveFilters: boolean;
  filteredCount: number;
  matchId: string;
  player1Name: string;
  player2Name: string;
  showFinalResult?: boolean;
  scoreState?: unknown;
  doubles?: TimelineDoublesConfig;
  format?: string;
}

/**
 * Bug 3 — determina se um dado set (1-based) é um Match Tiebreak decisivo
 * para o formato em questão.
 *
 * O engine só cria o N-ésimo set quando o placar de sets já chegou ao empate
 * que exige o MT (1x1 ou 2x2), portanto basta checar o número do set e o formato:
 *   - MATCH_TB_10              → sempre (único set, sempre MT)
 *   - BEST_OF_3_MATCH_TB,
 *     SHORT_SET_2V2_NO_AD,
 *     BEST_OF_3_NO_AD          → 3º set
 *   - BEST_OF_5                → 5º set (Grand Slam super-tiebreak)
 */
function isSetMatchTiebreak(format: string | undefined, setNumber: number): boolean {
  if (!format) return false;
  if (format === 'MATCH_TB_10') return true;
  if (
    (format === 'BEST_OF_3_MATCH_TB' ||
      format === 'SHORT_SET_2V2_NO_AD' ||
      format === 'BEST_OF_3_NO_AD') &&
    setNumber === 3
  ) return true;
  if (format === 'BEST_OF_5' && setNumber === 5) return true;
  return false;
}

export function TimelineTable({
  groupedBySet,
  points,
  hasActiveFilters,
  filteredCount,
  matchId,
  player1Name,
  player2Name,
  showFinalResult,
  scoreState,
  doubles,
  format,
}: TimelineTableProps) {
  // Bug 3 — isMatchTb como flag global (true quando o formato inteiro é só MT)
  // é usado apenas para o cabeçalho e para o filtro vazio.
  // Cada SetGroup recebe o seu próprio isMatchTb calculado por setNumber.
  const isFormatOnlyMatchTb = format === 'MATCH_TB_10';

  // Bug 7 — games iniciais do set (2 para SHORT_SET_2V2_NO_AD, 0 para os demais).
  // Necessário para calcular o número ordinal do game na coluna GAMES.
  const initialGames = format ? getInitialGames(format as TennisFormat) : 0;

  return (
    <div className="overflow-hidden border border-white/10 rounded-lg">
      <div className="overflow-auto max-h-[75vh]">
        <div className="min-w-[1000px]">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
            <TimelineTableHead isMatchTb={isFormatOnlyMatchTb} />
            <tbody className="bg-transparent">
              {hasActiveFilters && filteredCount === 0 && (
                <tr><td colSpan={isFormatOnlyMatchTb ? 24 : 25} className="text-center py-6 text-telemetry-text-muted text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => {
                // Bug 3 — cada grupo sabe se é Match Tiebreak decisivo.
                const groupIsMatchTb = isSetMatchTiebreak(format, group.setNumber);
                return (
                  <SetGroup
                    key={group.setNumber}
                    setNumber={group.setNumber}
                    points={group.points}
                    allPoints={points}
                    hasActiveFilters={hasActiveFilters}
                    isLast={gi === groupedBySet.length - 1}
                    matchId={matchId}
                    player1Name={player1Name}
                    player2Name={player2Name}
                    doubles={doubles}
                    isMatchTb={groupIsMatchTb}
                    initialGames={initialGames}
                  />
                );
              })}
              {showFinalResult && (
              <FinalResultRow
                points={points}
                scoreState={scoreState}
                player1Name={player1Name}
                player2Name={player2Name}
                doubles={doubles}
              />
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinalResultRow({
  points,
  scoreState,
  player1Name,
  player2Name,
  doubles,
}: {
  points: TimelinePoint[];
  scoreState?: unknown;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
}) {
  const setResults = getSetResults(points, scoreState);

  let p1SetsWon = 0;
  let p2SetsWon = 0;
  for (const sr of setResults) {
    if (sr.p1 > sr.p2) p1SetsWon++;
    else if (sr.p2 > sr.p1) p2SetsWon++;
  }
  const winner = p1SetsWon > p2SetsWon ? 'PLAYER_1' : p2SetsWon > p1SetsWon ? 'PLAYER_2' : null;

  const winnerLabel = winner
    ? winner === 'PLAYER_1'
      ? doubles?.player1PartnerName
        ? `Dupla 1 (${player1Name} / ${doubles.player1PartnerName})`
        : `Jogador 1 (${player1Name})`
      : doubles?.player2PartnerName
        ? `Dupla 2 (${player2Name} / ${doubles.player2PartnerName})`
        : `Jogador 2 (${player2Name})`
    : 'Empate';

  const placar = setResults
    .map((sr) => {
      const tb = sr.tiebreak ? `(${sr.tiebreak.p1}x${sr.tiebreak.p2})` : '';
      return `${sr.p1}/${sr.p2}${tb}`;
    })
    .join(' - ');

  return (
    <tr className="bg-telemetry-elevated border-t border-white/10 font-bold">
      <td colSpan={3} className="px-1.5 py-2 text-[10px] text-telemetry-text-primary sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3">
        Resultado Final
      </td>
      <td
        colSpan={2}
        className="px-1.5 py-2 text-[10px] border-r border-white/10 font-mono"
        aria-label={`Vencedor: ${winnerLabel}. Placar: ${placar}`}
      >
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-telemetry-text-primary">Vencedor – {winnerLabel}</span>
          <span className="text-telemetry-text-muted text-[9px] mt-1 block">Placar: {placar}</span>
        </div>
      </td>
      <td colSpan={20} aria-hidden="true" />
    </tr>
  );
}
