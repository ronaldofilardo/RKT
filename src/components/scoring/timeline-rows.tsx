import type { TimelinePoint } from '@/core/scoring/types';
import type { FilterCriteria } from './timeline-types';
import { situacaoLabel, golpeLabel, direcaoLabel, efeitoLabel, golpeEspLabel, subtipo1Label, subtipo2Label } from './timeline-utils';

interface PointRowProps {
  point: TimelinePoint;
  hasGap: boolean;
  isLast: boolean;
}

export function PointRow({ point: p, hasGap, isLast }: PointRowProps) {
  const isServeFinish = p.type === 'ACE' || p.type === 'DOUBLE_FAULT';
  const rowClass = [
    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-red-500',
    p.isBreakPoint ? 'bg-amber-50/40' : '',
  ].join(' ');

  const serverBallColor = p.server === 'player1' ? 'drop-shadow(0 0 2px #3b82f6)' : 'drop-shadow(0 0 2px #ef4444)';

  if (hasGap) {
    return (
      <>
        <tr>
          <td colSpan={13} className="text-center py-1.5">
            <span className="text-[10px] italic text-gray-400 border-t border-dashed border-b border-dashed border-gray-300 px-2">marcação interrompida</span>
          </td>
        </tr>
        <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
          {renderPointCells(p, isServeFinish, serverBallColor)}
        </tr>
      </>
    );
  }

  return (
    <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
      {renderPointCells(p, isServeFinish, serverBallColor)}
    </tr>
  );
}

function renderPointCells(p: TimelinePoint, isServeFinish: boolean, serverBallColor: string) {
  return (
    <>
      <td className="px-1.5 py-1.5 align-middle">
        <div className="flex items-center gap-0.5">
          <svg width="14" height="14" viewBox="0 0 18 18" style={{ filter: serverBallColor }}>
            <circle cx="9" cy="9" r="7" fill="#CCFF00" />
            <path d="M5 5 Q9 9 13 5" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M5 13 Q9 9 13 13" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
          {p.isBreakPoint && <Tag className="bg-amber-100 text-amber-700">BP</Tag>}
          {p.isGameBall && <Tag className="bg-yellow-100 text-yellow-700">GB</Tag>}
          {p.isSetBall && <Tag className="bg-purple-100 text-purple-700">SB</Tag>}
        </div>
      </td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{p.gamesScore.player1}-{p.gamesScore.player2}</td>
      <td className="px-1.5 py-1.5 text-[10px] font-bold text-gray-800">{getGameScoreLabelForPoint(p)}</td>
      <td className={`px-1.5 py-1.5 text-[10px] ${p.type === 'ACE' ? 'text-green-600 font-semibold' : p.type === 'DOUBLE_FAULT' ? 'text-red-600 font-semibold' : ''}`}>
        {formatAceOrDf(p)}
      </td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{isServeFinish ? 1 : p.rallyLength || 1}</td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : situacaoLabel(p.rallyDetails?.situacao)}</td>
      <td className={`px-1.5 py-1.5 text-[10px] font-bold ${p.type === 'WINNER' ? 'text-green-600' : p.type === 'UNFORCED_ERROR' ? 'text-red-600' : p.type === 'FORCED_ERROR' ? 'text-amber-600' : ''}`}>
        {isServeFinish ? '' : (
          p.type === 'WINNER' ? 'Winner'
          : p.type === 'UNFORCED_ERROR' ? 'ENF'
          : p.type === 'FORCED_ERROR' ? 'EF'
          : ''
        )}
      </td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : golpeLabel(p.rallyDetails?.golpe)}</td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : subtipo1Label(p.rallyDetails?.subtipo1)}</td>
      <td className={`px-1.5 py-1.5 text-[10px] ${p.rallyDetails?.subtipo2 === 'out' ? 'text-red-600 font-semibold' : p.rallyDetails?.subtipo2 === 'net' ? 'text-amber-600 font-semibold' : ''}`}>
        {isServeFinish ? '' : subtipo2Label(p.rallyDetails?.subtipo2)}
      </td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : direcaoLabel(p.rallyDetails?.direcao)}</td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish && p.type === 'ACE' ? efeitoLabel(p.rallyDetails?.efeito) : isServeFinish ? '' : efeitoLabel(p.rallyDetails?.efeito)}</td>
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : golpeEspLabel(p.rallyDetails?.golpe_esp)}</td>
    </>
  );
}

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  player1Name: string;
  player2Name: string;
  isLast: boolean;
}

export function SetGroup({ setNumber, points, hasActiveFilters, player1Name, player2Name, isLast }: SetGroupProps) {
  const firstPoint = points[0];
  const server = firstPoint?.server === 'player1' ? player1Name : player2Name;
  const receiver = firstPoint?.server === 'player1' ? player2Name : player1Name;

  return (
    <>
      <tr className="bg-gray-100 border-b border-gray-200">
        <td colSpan={3} className="px-1.5 py-2">
          <span className="text-[9px] font-black uppercase text-blue-600" style={{ letterSpacing: '0.12em' }}>SET {setNumber}</span>
        </td>
        <td colSpan={10} className="px-1.5 py-2">
          <span className="text-[10px] text-gray-500">{server} – {receiver}</span>
        </td>
      </tr>

      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;
        return (
          <PointRow
            key={`${p.setNumber}-${p.pointNumber}`}
            point={p}
            hasGap={!!hasGap}
            isLast={isLast && i === points.length - 1}
          />
        );
      })}
    </>
  );
}

function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`text-[7px] font-bold px-[3px] py-[1px] rounded leading-none ${className ?? ''}`}>
      {children}
    </span>
  );
}

function getGameScoreLabelForPoint(p: TimelinePoint): string {
  if (p.gameIsDeuce) return 'Deuce';
  if (p.gameAdvantage === 'player1') return 'Adv. P1';
  if (p.gameAdvantage === 'player2') return 'Adv. P2';
  
  const GAME_POINTS = ['0', '15', '30', '40'];
  const p1Score = GAME_POINTS[Math.min(p.gameScore.player1, 3)] ?? String(p.gameScore.player1);
  const p2Score = GAME_POINTS[Math.min(p.gameScore.player2, 3)] ?? String(p.gameScore.player2);
  return `${p1Score}-${p2Score}`;
}

function formatAceOrDf(p: TimelinePoint): string {
  if (p.type === 'ACE') return 'ACE';
  if (p.type === 'DOUBLE_FAULT') return 'DF';
  return '';
}