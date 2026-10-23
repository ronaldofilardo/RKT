import type { TennisFormat } from '@/core/scoring/types';
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical } from '@/lib/matchConfig';

export function getNextServerAfterSet(params: {
  currentServer: 'player1' | 'player2';
  /**
   * Sacador do Game 1 de TODA a partida (valor fixo — normalmente
   * `match.initialServerId`). Usado como âncora para recalcular o
   * sacador do set seguinte a partir da contagem total de games, em vez
   * do sacador "ao vivo" (que pode estar desatualizado em relação ao
   * placar sendo editado). Se omitido, cai para `currentServer` (mantém
   * o comportamento anterior, com os bugs conhecidos — ver comentário em
   * `computeServerForNextSetAfterTiebreak` em core/scoring/tiebreak.ts).
   */
  initialServer?: 'player1' | 'player2';
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
  completedSets?: Array<{ player1: number; player2: number }>;
}): 'player1' | 'player2' {
  const { currentServer, initialServer = currentServer, p1Games, p2Games, format, tiebreakPoints, completedSets = [] } = params;

  // Calcular setsWon a partir dos completedSets
  const p1Sets = completedSets.filter(s => s.player1 > s.player2).length;
  const p2Sets = completedSets.filter(s => s.player2 > s.player1).length;
  
  // Usar função canônica para determinar se é MT
  const lastSetIndex = completedSets.length;
  const isMatchTiebreakSet = isMatchTiebreakSetIndexCanonical(
    lastSetIndex,
    { player1: p1Sets, player2: p2Sets },
    format,
  );

  // For Match Tiebreak: server alternates every 2 points (standard tiebreak).
  // First point: tiebreakInitialServer serves, then alternate every 2 points.
  // When tiebreakPoints is available, use it directly. When null (e.g. editing
  // a MT set from completedSets), derive total points from p1Games + p2Games
  // since in MT the "games" field actually stores the tiebreak points.
  if (isMatchTiebreakSet) {
    const totalPoints = tiebreakPoints
      ? tiebreakPoints.player1 + tiebreakPoints.player2
      : p1Games + p2Games;

    const gamesBeforeMT = completedSets.reduce((sum, set) => sum + set.player1 + set.player2, 0);
    const tbInitialServer = params.initialServer !== undefined
      ? (gamesBeforeMT % 2 === 0 ? params.initialServer : (params.initialServer === 'player1' ? 'player2' : 'player1'))
      : currentServer;

    // Regra ITF (Regra 5b): 1º saque saca 1 ponto; a seguir, cada jogador saca 2 pontos alternados.
    // Pt 1 (totalPoints=0): Initial; Pts 2-3 (totalPoints=1,2): Other; Pts 4-5 (totalPoints=3,4): Initial...
    const turn = Math.floor((totalPoints + 1) / 2);
    if (turn % 2 === 0) {
      return tbInitialServer;
    }
    return tbInitialServer === 'player1' ? 'player2' : 'player1';
  }

  // Se for tiebreak de set em andamento (ex.: 6-6 com tiebreakPoints em progresso)
  if (tiebreakPoints && p1Games === p2Games) {
    const totalGamesBeforeTb = completedSets.reduce(
      (sum, set) => sum + set.player1 + set.player2,
      p1Games + p2Games
    );
    const tbInitialServer = totalGamesBeforeTb % 2 === 0 ? initialServer : (initialServer === 'player1' ? 'player2' : 'player1');
    const totalPoints = tiebreakPoints.player1 + tiebreakPoints.player2;
    const turn = Math.floor((totalPoints + 1) / 2);
    return turn % 2 === 0 ? tbInitialServer : (tbInitialServer === 'player1' ? 'player2' : 'player1');
  }

  // BUG FIX (2026-09-22): sets normais e sets decididos por tiebreak comum
  // (ex.: 7-6, 10-9 em PRO_SET_8) usam a MESMA fórmula — contagem total de
  // games da partida (o placar final do set já inclui o tiebreak: 7-6 =
  // 13 games) módulo 2, a partir de uma âncora FIXA (initialServer, quem
  // sacou o game 1 de toda a partida).
  //
  // Antes: um set decidido por tiebreak comum sempre "mantinha o mesmo
  // sacador" (ramo especial isTiebreakWin), o que contraria a regra
  // oficial (ITF): quem serviu o 1º ponto do tiebreak passa a RECEBER no
  // set seguinte, ou seja, o saque troca. E mesmo o ramo geral (não
  // tiebreak) usava `currentServer` — o sacador AO VIVO, já calculado a
  // partir do placar de ANTES da edição — como se fosse uma âncora fixa,
  // o que dá resposta errada sempre que a correção do set em andamento
  // muda a paridade do total de games (ex.: corrigir 2-1 para 3-1).
  const totalGamesInMatch = completedSets.reduce(
    (sum, set) => sum + set.player1 + set.player2,
    p1Games + p2Games
  );

  if (totalGamesInMatch % 2 === 0) return initialServer;
  return initialServer === 'player1' ? 'player2' : 'player1';
}
