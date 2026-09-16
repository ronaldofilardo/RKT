import type { TimelinePoint } from '@/core/scoring/types';
import type { FilterKey } from './timeline-types';
import { FilterBar } from './timeline-filters';
import { SetGroup } from './timeline-rows';

type Props = { points: TimelinePoint[]; player1Name: string; player2Name: string; matchId: string; activeFilters: Set<FilterKey>; filteredPoints: TimelinePoint[]; groupedBySet: { setNumber: number; points: TimelinePoint[] }[]; counts: { p1: number; p2: number; bp: number; ace: number; winner: number; forcedError: number; unforcedError: number; doubleFault: number; }; hasActiveFilters: boolean; onToggleFilter: (key: FilterKey) => void; onClearFilters: () => void; };

export function MatchTimelineContent({ points, player1Name, player2Name, matchId, activeFilters, filteredPoints, groupedBySet, counts, hasActiveFilters, onToggleFilter, onClearFilters }: Props) {
  if (points.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Esta sessão não possui pontos detalhados registrados.
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        activeFilters={activeFilters}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        counts={counts}
        playerNames={{ p1: player1Name, p2: player2Name }}
      />

      <p className="text-xs text-gray-500 mb-3">
        {hasActiveFilters
          ? `${filteredPoints.length} de ${points.length} pontos`
          : `${points.length} pontos`}
      </p>

      <div className="mb-3 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
        <p className="font-semibold text-gray-700 mb-1">Como ler esta tabela</p>
        <p>Cada linha é um ponto disputado, na ordem em que aconteceu. <strong>no.</strong> = número do ponto; <strong>P/</strong> = ganhador do ponto ({player1Name}/{player2Name}); <strong>SAC</strong> = sacador ({player1Name}/{player2Name}).</p>
        <p><strong>GAMES</strong> = placar de games/set (mostrado só no 1º ponto de cada game) · <strong>PONTOS</strong> = placar de pontos (15-0, Deuce, Adv. P1).</p>
        <p><strong>1º / 2º Saque</strong>: mostra ACE, OUT ou NET conforme o resultado de cada saque, além de efeito e direção. Apenas um dos saques é preenchido por ponto.</p>
        <p><strong>TIPO</strong>: <strong>ACe</strong> = Ace · <strong>DF</strong> = Dupla Falta · <strong>Winner</strong> = ponto vencedor direto · <strong>ENF</strong> = Erro Não Forçado · <strong>EF</strong> = Erro Forçado</p>
        <p><strong>ERRO</strong> = tipo de erro na rede (Passing Shot, Devolução). <strong>ONDE</strong> = onde errou (Out, Net). <strong>SITUAÇÃO / GOLPE / EFEITO / DIREÇÃO</strong> descrevem como o ponto terminou. <strong>ESPECIAL</strong> = golpe especial (lob, drop shot, etc.). <strong>RALLY</strong> = faixa de bolas trocadas conforme duração marcada (3-6, 7-10, 11+).</p>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th colSpan={3} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-100 z-20 border-r border-gray-300">SET</th>
                <th colSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">PLACAR</th>
                <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">1º Saque</th>
                <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">2º Saque</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">SITUAÇÃO</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-200">
                  <div className="flex flex-col leading-tight">
                    <span>TIPO</span>
                    <span className="text-[7px] font-normal text-gray-400 normal-case">ENF, EF, W</span>
                  </div>
                </th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ERRO</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ONDE</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">GOLPE</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">EFEITO</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">DIREÇÃO</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ESPECIAL</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">RALLY</th>
                <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">OBS</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">no.</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">P/</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">SAC</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">GAMES</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">PONTOS</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">ACE</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">OUT</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">NET</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">EFE</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">DIR</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">ACE</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">OUT</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">NET</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">EFE</th>
                <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">DIR</th>
              </tr>
            </thead>
            <tbody>
              {hasActiveFilters && filteredPoints.length === 0 && (
                <tr><td colSpan={25} className="text-center py-6 text-gray-400 text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => (
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
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
