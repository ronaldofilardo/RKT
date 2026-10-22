import type { ScoringEngineConfig, TennisFormat, DoublesConfig, Side } from './types';

export interface MatchLikeForEngine {
  format: string | TennisFormat;
  player1Id?: string | null;
  player2Id?: string | null;
  player1?: { id: string; name?: string };
  player2?: { id: string; name?: string };
  initialServerId?: string | null;
  matchType?: 'SINGLES' | 'DOUBLES' | string | null;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  player1Partner?: { id: string; name?: string } | null;
  player2Partner?: { id: string; name?: string } | null;
  doublesSetup?: unknown;
  scoreState?: unknown;
}

/**
 * Constrói a configuração ScoringEngineConfig unificada a partir de qualquer objeto
 * de partida (Match do Prisma, MatchData do cliente, ou parâmetros de rota).
 * Garante que parâmetros de duplas sejam uniformemente extraídos e repassados ao engine.
 */
export function buildEngineConfig(match: MatchLikeForEngine): ScoringEngineConfig {
  const p1Id = match.player1Id ?? match.player1?.id ?? '';
  const p2Id = match.player2Id ?? match.player2?.id ?? '';
  const initialServerId = match.initialServerId || p1Id;
  const format = match.format as TennisFormat;

  const p1PartnerId = match.player1PartnerId ?? match.player1Partner?.id ?? null;
  const p2PartnerId = match.player2PartnerId ?? match.player2Partner?.id ?? null;

  const isDoubles = match.matchType === 'DOUBLES' || Boolean(p1PartnerId && p2PartnerId);

  let doubles: DoublesConfig | undefined = undefined;

  if (isDoubles && p1PartnerId && p2PartnerId) {
    const rawSetup = (typeof match.doublesSetup === 'object' && match.doublesSetup !== null
      ? match.doublesSetup
      : undefined) as {
        serveOrder?: Record<Side, [string, string]>;
        receiveDeuce?: Record<Side, string>;
      } | undefined;
    const scoreStateObj = match.scoreState as Record<string, unknown> | null;
    const scoreStateDoubles = (scoreStateObj?.doubles ?? (scoreStateObj?.state as any)?.doubles) as {
      serveOrder?: Record<Side, [string, string]>;
      receiveDeuce?: Record<Side, string>;
    } | undefined;

    const serveOrder = rawSetup?.serveOrder ?? scoreStateDoubles?.serveOrder ?? {
      player1: [p1Id, p1PartnerId] as [string, string],
      player2: [p2Id, p2PartnerId] as [string, string],
    };

    const receiveDeuce = rawSetup?.receiveDeuce ?? scoreStateDoubles?.receiveDeuce ?? {
      player1: p1Id,
      player2: p2Id,
    };

    doubles = {
      members: {
        player1: [p1Id, p1PartnerId],
        player2: [p2Id, p2PartnerId],
      },
      initial: {
        serveOrder,
        receiveDeuce,
      },
    };
  }

  return {
    format,
    player1Id: p1Id,
    player2Id: p2Id,
    initialServerId,
    ...(doubles ? { doubles } : {}),
  };
}
