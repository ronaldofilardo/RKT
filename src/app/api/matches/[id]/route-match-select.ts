/**
 * Select canônico do GET /api/matches/[id].
 *
 * Mantido como constante nomeada (R-12/R-03) para o handler da rota
 * permanecer enxuto sem alterar o payload — consumidores e testes de
 * contrato leem este objeto.
 */
export const MATCH_SELECT = {
  id: true,
  state: true,
  format: true,
  sportType: true,
  courtType: true,
  scheduledAt: true,
  startedAt: true,
  finishedAt: true,
  nickname: true,
  visibility: true,
  isResuming: true,
  openForAnnotation: true,
  tournamentName: true,
  category: true,
  round: true,
  bracketType: true,
  temperature: true,
  humidity: true,
  version: true,
  scoreState: true,
  initialServerId: true,
  matchType: true,
  player1Id: true,
  player2Id: true,
  player1PartnerId: true,
  player2PartnerId: true,
  player1: { select: { id: true, name: true } },
  player2: { select: { id: true, name: true } },
  player1Partner: { select: { id: true, name: true } },
  player2Partner: { select: { id: true, name: true } },
  doublesSetup: true,
  createdByUserId: true,
  _count: { select: { pointLog: { where: { voidedAt: null } } } },
} as const;
