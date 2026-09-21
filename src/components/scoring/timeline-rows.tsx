import type { TimelinePoint } from '@/core/scoring/types';
import { GAME_POINTS } from '@/core/scoring/point-utils';
import { AudioNotePlayer } from './AudioNotePlayer';
import {
  situacaoLabel,
  golpeLabel,
  direcaoLabel,
  efeitoLabel,
  golpeEspLabel,
  duracaoLabel,
  subtipo1Label,
  subtipo2Label,
  getPointDetailSummary,
} from './timeline-utils';

interface PointRowProps {
  point: TimelinePoint;
  hasGap: boolean;
  isLast: boolean;
  matchId: string;
  /** Quando true, esta linha é o primeiro ponto do game atual. */
  isFirstPointOfGame: boolean;
  player1Name: string;
  player2Name: string;
}

/**
 * Iniciais do atleta para as colunas "P/" e "SAC":
 * - Nome + sobrenome (2+ palavras): iniciais de cada um, ex. "Rafael Nadal" → "R.N.".
 * - Um único nome: as 3 primeiras letras, ex. "Djokovic" → "Djo".
 */
export function getPlayerInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first}.${last}.`;
  }
  const single = parts[0];
  const letters = single.slice(0, 3);
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}

const BADGE_COLORS = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-700',
} as const;

function getPointBadge(p: TimelinePoint): { label: string; color: 'green' | 'red' | 'amber' | 'gray' } {
  // Evento (PointFlow.type) tem precedência sobre rd.tipo para saques
  if (p.type === 'ACE') return { label: 'Ace', color: 'green' };
  if (p.type === 'DOUBLE_FAULT') return { label: 'DF', color: 'red' };
  if (p.type === 'WINNER') return { label: 'W', color: 'green' };
  if (p.type === 'UNFORCED_ERROR') return { label: 'ENF', color: 'red' };
  if (p.type === 'FORCED_ERROR') return { label: 'EF', color: 'amber' };
  // Fallback: usa classificação detalhada do rallyDetails
  return getPointDetailSummary(p.rallyDetails);
}

export function PointRow({ point: p, hasGap, isLast: _isLast, matchId, isFirstPointOfGame, player1Name, player2Name }: PointRowProps) {
  const rd = p.rallyDetails;
  const badge = getPointBadge(p);
  const isServeDecidedPoint = p.type === 'ACE' || p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_FIRST';

  const rowClass = [
    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-red-500',
    p.isBreakPoint ? 'bg-amber-50/40' : '',
  ].join(' ');

  const serverNumber = p.server === 'player1' ? 1 : 2;
  const winnerNumber = p.winner === 'PLAYER_1' ? 1 : 2;
  const winnerInitials = getPlayerInitials(winnerNumber === 1 ? player1Name : player2Name);
  const serverInitials = getPlayerInitials(serverNumber === 1 ? player1Name : player2Name);

  const firstOutcome = p.firstServeOutcome;
  const secondOutcome = p.secondServeOutcome;

  const cells = (
    <>
      {/* no. — pointNumber */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-700 font-semibold sticky left-0 bg-white z-10 border-r border-gray-200">
        {p.pointNumber}
      </td>
      {/* SAC — sacador (iniciais do atleta) */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${serverNumber === 1 ? 'text-blue-600' : 'text-red-600'}`}>
        {serverInitials}
      </td>
      {/* Venc — ganhador do ponto (iniciais do atleta) */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-bold ${winnerNumber === 1 ? 'text-blue-600' : 'text-red-600'}`}>
        {winnerInitials}
      </td>
      {/* GAMES — placar de games (ou tiebreak score quando isTiebreak) */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-700 font-semibold text-center">
        {p.isTiebreak
          ? `${p.gamesScore.player1}x${p.gamesScore.player2}`
          : isFirstPointOfGame ? p.gamesScore.player1 + p.gamesScore.player2 + 1 : '–'}
      </td>
      {/* PONTOS — placar de pontos dentro do game */}
      <td className="px-1.5 py-1.5 text-[10px] font-bold text-gray-800">{getGameScoreLabelForPoint(p)}</td>
      {/* 1º Saque — ACE */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'ace' ? 'text-green-600' : 'text-gray-400'}`}>
        {firstOutcome === 'ace' ? 'ACE' : '–'}
      </td>
      {/* 1º Saque — OUT */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'out' ? 'text-red-600' : 'text-gray-400'}`}>
        {firstOutcome === 'out' ? 'OUT' : '–'}
      </td>
      {/* 1º Saque — NET */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'net' ? 'text-amber-600' : 'text-gray-400'}`}>
        {firstOutcome === 'net' ? 'NET' : '–'}
      </td>
      {/* 1º Saque — Efeito */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">
        {firstOutcome === 'ace' ? efeitoLabel(rd?.efeito) : firstOutcome ? efeitoLabel(p.firstFault?.serveEffect) : '–'}
      </td>
      {/* 1º Saque — Direção */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">
        {firstOutcome === 'ace' ? direcaoLabel(rd?.direcao) : firstOutcome ? direcaoLabel(p.firstFault?.direction) : '–'}
      </td>
      {/* 2º Saque — ACE */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'ace' ? 'text-green-600' : 'text-gray-400'}`}>
        {secondOutcome === 'ace' ? 'ACE' : '–'}
      </td>
      {/* 2º Saque — OUT */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'out' ? 'text-red-600' : 'text-gray-400'}`}>
        {secondOutcome === 'out' ? 'OUT' : '–'}
      </td>
      {/* 2º Saque — NET */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'net' ? 'text-amber-600' : 'text-gray-400'}`}>
        {secondOutcome === 'net' ? 'NET' : '–'}
      </td>
      {/* 2º Saque — Efeito */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">
        {secondOutcome ? efeitoLabel(rd?.efeito) : '–'}
      </td>
      {/* 2º Saque — Direção */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">
        {secondOutcome ? direcaoLabel(rd?.direcao) : '–'}
      </td>
      {/* SITUAÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : situacaoLabel(rd?.situacao)}</td>
      {/* TIPO badge (ENF/EF/W) */}
      <td className="px-1.5 py-1.5 text-[10px] border-l border-gray-200">
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${BADGE_COLORS[badge.color]}`}>
          {badge.label}
        </span>
      </td>
      {/* SUBTIPO1 — Tipo de Erro (Rede) */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : subtipo1Label(rd?.subtipo1)}</td>
      {/* SUBTIPO2 — Onde Errou? */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : subtipo2Label(rd?.subtipo2)}</td>
      {/* GOLPE */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : golpeLabel(rd?.golpe)}</td>
      {/* EFEITO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : efeitoLabel(rd?.efeito)}</td>
      {/* DIREÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : direcaoLabel(rd?.direcao)}</td>
      {/* GOLPES ESPECIAIS */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeDecidedPoint ? '–' : golpeEspLabel(rd?.golpe_esp)}</td>
      {/* RALLY */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{isServeDecidedPoint ? '–' : duracaoLabel(rd?.duracao)}</td>
      {/* OBSERVAÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-gray-600 whitespace-normal break-words">
        <div className="flex flex-col gap-1">
          {p.note && !/^SET\s+\d+$/i.test(p.note) ? <span>📝 {p.note.replace(/Match Tie-?break/ig, 'MTB').replace(/Tie-?break/ig, 'TB').replace(/Match Tie-?brake/ig, 'MTB').replace(/Tie-?brake/ig, 'TB')}</span> : null}
          {p.hasAudioNote && p.pointId ? (
            <AudioNotePlayer
              matchId={matchId}
              pointId={p.pointId}
              durationMs={p.audioNoteDuration}
            />
          ) : null}
          {( (!p.note || /^SET\s+\d+$/i.test(p.note)) && !p.hasAudioNote ) ? '–' : null}
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
          <td colSpan={25} className="text-center py-2 bg-amber-50/60 border-y border-dashed border-amber-300">
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
          <td colSpan={25} className="text-center py-1.5">
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

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
}

export function SetGroup({ setNumber: _setNumber, points, hasActiveFilters, isLast, matchId, player1Name, player2Name }: SetGroupProps) {
  return (
    <>
      {!hasActiveFilters && (
        <tr>
          <td
            colSpan={25}
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 border-y border-gray-300"
          >
            <div className="flex items-center gap-2">
              <span>Set {_setNumber}</span>
            </div>
          </td>
        </tr>
      )}
      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;
        // gamesScore muda → novo game. Também usamos o gameScore como
        // fallback (quando gamesScore é igual mas gameScore zerou, ex.:
        // tiebreak).
        const isFirstPointOfGame =
          i === 0 ||
          prevPoint!.gamesScore.player1 !== p.gamesScore.player1 ||
          prevPoint!.gamesScore.player2 !== p.gamesScore.player2 ||
          (prevPoint!.gameScore.player1 === 0 && prevPoint!.gameScore.player2 === 0);
        return (
          <PointRow
            key={`${p.setNumber}-${p.pointNumber}`}
            point={p}
            hasGap={!!hasGap}
            isLast={isLast && i === points.length - 1}
            matchId={matchId}
            isFirstPointOfGame={isFirstPointOfGame}
            player1Name={player1Name}
            player2Name={player2Name}
          />
        );
      })}
    </>
  );
}

function getGameScoreLabelForPoint(p: TimelinePoint): string {
  if (p.isTiebreak) {
    return `${p.gameScore.player1}x${p.gameScore.player2}`;
  }
  if (p.gameIsDeuce) return 'Deuce';
  if (p.gameAdvantage === 'player1') return 'Adv. P1';
  if (p.gameAdvantage === 'player2') return 'Adv. P2';

  const p1Score = GAME_POINTS[Math.min(p.gameScore.player1, 3)] ?? String(p.gameScore.player1);
  const p2Score = GAME_POINTS[Math.min(p.gameScore.player2, 3)] ?? String(p.gameScore.player2);
  return `${p1Score}-${p2Score}`;
}
