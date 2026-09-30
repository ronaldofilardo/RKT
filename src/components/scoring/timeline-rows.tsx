import { Fragment } from 'react';
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
  getGameEndInfo,
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
  green: 'bg-green-500/20 text-green-400',
  red: 'bg-telemetry-error/20 text-telemetry-error',
  amber: 'bg-telemetry-alert/20 text-telemetry-alert',
  gray: 'bg-white/10 text-telemetry-text-primary',
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
    'border-b border-white/5 hover:bg-white/5 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-telemetry-blue' : 'border-l-[3px] border-l-telemetry-error',
    p.isBreakPoint ? 'bg-telemetry-alert/10' : '',
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
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-primary font-semibold sticky left-0 bg-telemetry-base z-10 border-r border-white/10">
        {p.pointNumber}
      </td>
      {/* SAC — sacador (iniciais do atleta) */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${serverNumber === 1 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
        {serverInitials}
      </td>
      {/* Venc — ganhador do ponto (iniciais do atleta) */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-bold ${winnerNumber === 1 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
        {winnerInitials}
      </td>
      {/* GAMES — placar de games (ou tiebreak score quando isTiebreak) */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-primary font-semibold text-center">
        {p.isTiebreak
          ? `${p.gamesScore.player1}x${p.gamesScore.player2}`
          : isFirstPointOfGame ? p.gamesScore.player1 + p.gamesScore.player2 + 1 : '–'}
      </td>
      {/* PONTOS — placar de pontos dentro do game */}
      <td className="px-1.5 py-1.5 text-[10px] font-bold text-telemetry-text-primary">{getGameScoreLabelForPoint(p)}</td>
      {/* 1º Saque — ACE */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'ace' ? 'text-green-400' : 'text-telemetry-text-muted/50'}`}>
        {firstOutcome === 'ace' ? 'ACE' : '–'}
      </td>
      {/* 1º Saque — OUT */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'out' ? 'text-telemetry-error' : 'text-telemetry-text-muted/50'}`}>
        {firstOutcome === 'out' ? 'OUT' : '–'}
      </td>
      {/* 1º Saque — NET */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${firstOutcome === 'net' ? 'text-telemetry-alert' : 'text-telemetry-text-muted/50'}`}>
        {firstOutcome === 'net' ? 'NET' : '–'}
      </td>
      {/* 1º Saque — Efeito */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">
        {firstOutcome === 'ace' ? efeitoLabel(rd?.efeito) : firstOutcome ? efeitoLabel(p.firstFault?.serveEffect) : '–'}
      </td>
      {/* 1º Saque — Direção */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">
        {firstOutcome === 'ace' ? direcaoLabel(rd?.direcao) : firstOutcome ? direcaoLabel(p.firstFault?.direction) : '–'}
      </td>
      {/* 2º Saque — ACE */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'ace' ? 'text-green-400' : 'text-telemetry-text-muted/50'}`}>
        {secondOutcome === 'ace' ? 'ACE' : '–'}
      </td>
      {/* 2º Saque — OUT */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'out' ? 'text-telemetry-error' : 'text-telemetry-text-muted/50'}`}>
        {secondOutcome === 'out' ? 'OUT' : '–'}
      </td>
      {/* 2º Saque — NET */}
      <td className={`px-1.5 py-1.5 text-[10px] text-center font-semibold ${secondOutcome === 'net' ? 'text-telemetry-alert' : 'text-telemetry-text-muted/50'}`}>
        {secondOutcome === 'net' ? 'NET' : '–'}
      </td>
      {/* 2º Saque — Efeito */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">
        {secondOutcome ? efeitoLabel(rd?.efeito) : '–'}
      </td>
      {/* 2º Saque — Direção */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">
        {secondOutcome ? direcaoLabel(rd?.direcao) : '–'}
      </td>
      {/* SITUAÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : situacaoLabel(rd?.situacao)}</td>
      {/* TIPO badge (ENF/EF/W) */}
      <td className="px-1.5 py-1.5 text-[10px] border-l border-white/10">
        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${BADGE_COLORS[badge.color]}`}>
          {badge.label}
        </span>
      </td>
      {/* SUBTIPO1 — Tipo de Erro (Rede) */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : subtipo1Label(rd?.subtipo1)}</td>
      {/* SUBTIPO2 — Onde Errou? */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : subtipo2Label(rd?.subtipo2)}</td>
      {/* GOLPE */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : golpeLabel(rd?.golpe)}</td>
      {/* EFEITO */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : efeitoLabel(rd?.efeito)}</td>
      {/* DIREÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : direcaoLabel(rd?.direcao)}</td>
      {/* GOLPES ESPECIAIS */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted">{isServeDecidedPoint ? '–' : golpeEspLabel(rd?.golpe_esp)}</td>
      {/* RALLY */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted/70">{isServeDecidedPoint ? '–' : duracaoLabel(rd?.duracao)}</td>
      {/* OBSERVAÇÃO */}
      <td className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted whitespace-normal break-words">
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
          <td colSpan={25} className="text-center py-2 bg-telemetry-alert/10 border-y border-dashed border-telemetry-alert/30">
            <span className="text-[10px] text-telemetry-alert">
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
            <span className="text-[10px] italic text-telemetry-text-muted/50 border-t border-dashed border-b border-dashed border-white/20 px-2">marcação interrompida</span>
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
            aria-label={`Set ${_setNumber}`}
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-telemetry-text-primary bg-telemetry-elevated border-y border-white/10"
          >
            <div className="flex items-center gap-2">
              <span>Set {_setNumber}</span>
            </div>
          </td>
        </tr>
      )}
      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const nextPoint = i < points.length - 1 ? points[i + 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;
        // gamesScore muda → novo game. Também usamos o gameScore como
        // fallback (quando gamesScore é igual mas gameScore zerou, ex.:
        // tiebreak).
        const isFirstPointOfGame =
          i === 0 ||
          prevPoint!.gamesScore.player1 !== p.gamesScore.player1 ||
          prevPoint!.gamesScore.player2 !== p.gamesScore.player2 ||
          (prevPoint!.gameScore.player1 === 0 && prevPoint!.gameScore.player2 === 0);

        const isLastPointOfSet = i === points.length - 1;
        const gameEnd = !hasActiveFilters ? getGameEndInfo(p, nextPoint, isLastPointOfSet) : null;
        const winnerName = gameEnd?.winner === 'PLAYER_1' ? player1Name : player2Name;

        return (
          <Fragment key={`${p.setNumber}-${p.pointNumber}`}>
            <PointRow
              point={p}
              hasGap={!!hasGap}
              isLast={isLast && isLastPointOfSet}
              matchId={matchId}
              isFirstPointOfGame={isFirstPointOfGame}
              player1Name={player1Name}
              player2Name={player2Name}
            />
            {gameEnd && (
              <tr
                data-testid={`game-end-${p.setNumber}-${p.pointNumber}`}
                aria-label={`Placar final do game: ${gameEnd.gameFinalScore.player1}x${gameEnd.gameFinalScore.player2}`}
                className="bg-telemetry-elevated/70 border-y border-white/10 font-bold"
              >
                <td
                  colSpan={3}
                  className="px-1.5 py-1.5 text-[10px] text-telemetry-text-muted sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3"
                >
                  {p.isTiebreak ? 'Fim do Tiebreak' : 'Fim do Game'}
                </td>
                <td colSpan={2} className="px-1.5 py-1.5 text-[10px] text-center text-telemetry-text-primary border-r border-white/10">
                  <span className="font-bold tracking-wide">
                    {gameEnd.gameFinalScore.player1}x{gameEnd.gameFinalScore.player2}
                  </span>
                </td>
                <td colSpan={20} className="px-2 py-1.5 text-[10px] text-telemetry-text-muted font-normal">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-telemetry-text-primary">
                      {winnerName}
                    </span>
                    {gameEnd.isBreak ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                        Quebra de saque
                      </span>
                    ) : !p.isTiebreak ? (
                      <span className="text-[9px] text-telemetry-text-muted/60">
                        Confirmou o saque
                      </span>
                    ) : null}
                    <span className="text-telemetry-text-muted/50 text-[9px]">
                      · Placar final: {gameEnd.gameFinalScore.player1}x{gameEnd.gameFinalScore.player2}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
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
