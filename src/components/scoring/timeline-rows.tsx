import type { TimelinePoint } from '@/core/scoring/types';
import { GAME_POINTS } from '@/core/scoring/point-utils';
import { AudioNotePlayer } from './AudioNotePlayer';
import {
  situacaoLabel,
  golpeLabel,
  direcaoLabel,
  efeitoLabel,
  golpeEspLabel,
  subtipo1Label,
  subtipo2Label,
  trocasFaixaLabel,
  getPointDetailSummary,
} from './timeline-utils';

interface PointRowProps {
  point: TimelinePoint;
  hasGap: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
}

const BADGE_COLORS = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-700',
} as const;

function getPointBadge(p: TimelinePoint): { label: string; color: 'green' | 'red' | 'amber' | 'gray' } {
  // Evento (PointFlow.type) tem precedência sobre rd.tipo para saques
  if (p.type === 'ACE') return { label: 'ACe', color: 'green' };
  if (p.type === 'DOUBLE_FAULT') return { label: 'DF', color: 'red' };
  if (p.type === 'WINNER') return { label: 'Winner', color: 'green' };
  if (p.type === 'UNFORCED_ERROR') return { label: 'ENF', color: 'red' };
  if (p.type === 'FORCED_ERROR') return { label: 'EF', color: 'amber' };
  // Fallback: usa classificação detalhada do rallyDetails
  return getPointDetailSummary(p.rallyDetails);
}

export function PointRow({ point: p, hasGap, isLast: _isLast, matchId, player1Name, player2Name }: PointRowProps) {
  const rd = p.rallyDetails;
  const badge = getPointBadge(p);
  const isDoubleFault = p.type === 'DOUBLE_FAULT';
  // Pontos de saque-falta (1ª ou 2ª): os detalhes do rally (situação,
  // golpe, efeito, direção, onde errou) ficam redundantes com as colunas
  // dedicadas "1ª FALTA" e "2ª FALTA" — aqui os suprimimos para evitar
  // duplicação, deixando essas infos apenas nas colunas dedicadas.
  const isFaultPoint = p.type === 'FAULT_FIRST' || isDoubleFault || p.isSecondServe === true;

  const rowClass = [
    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-red-500',
    p.isBreakPoint ? 'bg-amber-50/40' : '',
  ].join(' ');

  const serverBallColor = p.server === 'player1' ? 'drop-shadow(0 0 2px #3b82f6)' : 'drop-shadow(0 0 2px #ef4444)';
  const serverName = p.server === 'player1' ? player1Name : player2Name;
  const winnerName = p.winner === 'PLAYER_1' ? player1Name : player2Name;

  const cells = (
    <>
      {/* SAQUE (quem sacou) */}
      <td className="px-1.5 py-1.5 align-middle">
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 18 18" style={{ filter: serverBallColor, flexShrink: 0 }}>
            <circle cx="9" cy="9" r="7" fill="#CCFF00" />
            <path d="M5 5 Q9 9 13 5" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M5 13 Q9 9 13 13" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="text-[10px] text-gray-600 truncate">{serverName}</span>
        </div>
        <div className="flex items-center gap-0.5 mt-0.5">
          {p.isBreakPoint && <Tag className="bg-amber-100 text-amber-700">BP</Tag>}
          {p.isGameBall && <Tag className="bg-yellow-100 text-yellow-700">GB</Tag>}
          {p.isSetBall && <Tag className="bg-purple-100 text-purple-700">SB</Tag>}
        </div>
      </td>
      {/* PLACAR GAMES */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{p.gamesScore.player1}-{p.gamesScore.player2}</td>
      {/* PLACAR GAME */}
      <td className="px-1.5 py-1.5 text-[10px] font-bold text-gray-800">{getGameScoreLabelForPoint(p)}</td>
      {/* VENCEDOR DO PONTO */}
      <td className={`px-1.5 py-1.5 text-[10px] font-semibold truncate ${p.winner === 'PLAYER_1' ? 'text-blue-600' : 'text-red-600'}`}>
        {winnerName}
      </td>
      {/* TIPO */}
      <td className="px-1.5 py-1.5 text-[10px]">
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${BADGE_COLORS[badge.color]}`}>
          {badge.label}
        </span>
      </td>
      {/* SITUAÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : situacaoLabel(rd?.situacao)}</td>
      {/* GOLPE */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : golpeLabel(rd?.golpe)}</td>
      {/* EFEITO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : efeitoLabel(rd?.efeito)}</td>
      {/* DIREÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : direcaoLabel(rd?.direcao)}</td>
      {/* ONDE ERROU (subtipo2) */}
      <td className={`px-1.5 py-1.5 text-[10px] ${!isFaultPoint && rd?.subtipo2 === 'out' ? 'text-red-600 font-semibold' : !isFaultPoint && rd?.subtipo2 === 'net' ? 'text-amber-600 font-semibold' : ''}`}>
        {isFaultPoint ? '–' : subtipo2Label(rd?.subtipo2)}
      </td>
      {/* SUBTIPO 1 */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : subtipo1Label(rd?.subtipo1)}</td>
      {/* 1ª FALTA (firstFault) */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{formatFirstFault(p)}</td>
      {/* 2ª FALTA — detalhe compacto da 2ª falta do DF */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isDoubleFault ? formatSecondFault(p) : (p.isSecondServe && p.type !== 'ACE' ? formatSecondFault(p) : '–')}</td>
      {/* TROCAS */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{trocasFaixaLabel(p.rallyLength)}</td>
      {/* ESPECIAL */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isFaultPoint ? '–' : golpeEspLabel(rd?.golpe_esp)}</td>
      {/* OBS */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600 whitespace-normal break-words">
        <div className="flex flex-col gap-1">
          {p.note ? <span>📝 {p.note}</span> : null}
          {p.hasAudioNote && p.pointId ? (
            <AudioNotePlayer
              matchId={matchId}
              pointId={p.pointId}
              durationMs={p.audioNoteDuration}
            />
          ) : null}
          {!p.note && !p.hasAudioNote ? '–' : null}
        </div>
      </td>
    </>
  );

  if (p.segmentBreak) {
    const editedAtLabel = new Date(p.segmentBreak.editedAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <>
        <tr>
          <td colSpan={16} className="text-center py-2 bg-amber-50/60 border-y border-dashed border-amber-300">
            <span className="text-[10px] text-amber-800">
              ⏸ Partida interrompida em <strong>{p.segmentBreak.previousLabel}</strong> · placar ajustado para <strong>{p.segmentBreak.newLabel}</strong> em {editedAtLabel}
            </span>
          </td>
        </tr>
        <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
          {cells}
        </tr>
      </>
    );
  }

  if (hasGap) {
    return (
      <>
        <tr>
          <td colSpan={16} className="text-center py-1.5">
            <span className="text-[10px] italic text-gray-400 border-t border-dashed border-b border-dashed border-gray-300 px-2">marcação interrompida</span>
          </td>
        </tr>
        <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
          {cells}
        </tr>
      </>
    );
  }

  return (
    <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
      {cells}
    </tr>
  );
}

function formatFirstFault(p: TimelinePoint): string {
  const ff = p.firstFault;
  if (!ff) return '–';
  const parts: string[] = [];
  if (ff.errorType) parts.push(ff.errorType);
  if (ff.serveEffect) parts.push(ff.serveEffect);
  if (ff.direction) parts.push(ff.direction);
  return parts.length > 0 ? parts.join(' • ') : '–';
}

function formatSecondFault(p: TimelinePoint): string {
  const rd = p.rallyDetails;
  if (!rd) return '–';
  const parts: string[] = [];
  if (rd.subtipo2) parts.push(rd.subtipo2);
  if (rd.efeito) parts.push(rd.efeito);
  if (rd.direcao) parts.push(rd.direcao);
  return parts.length > 0 ? parts.join(' • ') : '–';
}

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  player1Name: string;
  player2Name: string;
  isLast: boolean;
  matchId: string;
}

export function SetGroup({ setNumber, points, hasActiveFilters, player1Name, player2Name, isLast, matchId }: SetGroupProps) {
  const firstPoint = points[0];
  const server = firstPoint?.server === 'player1' ? player1Name : player2Name;
  const receiver = firstPoint?.server === 'player1' ? player2Name : player1Name;

  return (
    <>
      <tr className="bg-gray-100 border-b border-gray-200">
        <td colSpan={3} className="px-1.5 py-2">
          <span className="text-[9px] font-black uppercase text-blue-600" style={{ letterSpacing: '0.12em' }}>SET {setNumber}</span>
        </td>
        <td colSpan={13} className="px-1.5 py-2">
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
            matchId={matchId}
            player1Name={player1Name}
            player2Name={player2Name}
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

  const p1Score = GAME_POINTS[Math.min(p.gameScore.player1, 3)] ?? String(p.gameScore.player1);
  const p2Score = GAME_POINTS[Math.min(p.gameScore.player2, 3)] ?? String(p.gameScore.player2);
  return `${p1Score}-${p2Score}`;
}
