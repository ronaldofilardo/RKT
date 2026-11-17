/**
 * Kit de testes de contracts.test.ts (não é .test.ts: fica fora da coleta do
 * Jest e não é limitado a 80L). Concentra o arrange original:
 * - listas de valores válidos usadas pelos it.each dos enums;
 * - fixtures de entidade e de payload (rally, user, score state, match,
 *   inputs de criação/finish/arrangement);
 * - parsedData()/parsedError(): leitura direta de data/error do resultado de
 *   safeParse, substituindo os `if (result.success)` / `if (!result.success)`
 *   do original — em todos os 7 casos o assert anterior de `result.success`
 *   já garante o ramo, então o acesso direto é equivalente.
 */

export const rallySituacaoValues = ["devolucao", "fundo", "passada", "rede", "saque"];

export const rallyTipoValues = ["erro_nao_forcado", "erro_forcado", "winner", "dupla_falta"];

export const rallyGolpeValues = ["fh", "bh", "vfh", "vbh", "smash", "saque", "approach_fh", "approach_bh"];

export const rallyDirecaoValues = ["cruzada", "paralela", "centro", "inside_out", "inside_in", "aberto", "fechado"];

export const rallyGolpeEspValues = ["lob", "drop_shot", "bate_pronto", "swing_volley"];

export const matchStateValues = ["SCHEDULED", "IN_PROGRESS", "FINISHED", "CANCELLED"];

export const matchFinishReasonValues = ["COMPLETED", "ABANDONED", "WALKOVER", "INJURY", "OUTRO"];

export const matchFormatValues = [
  "BEST_OF_3",
  "BEST_OF_3_MATCH_TB",
  "BEST_OF_3_NO_AD",
  "BEST_OF_5",
  "SHORT_SET_2V2_NO_AD",
  "MATCH_TB_10",
  "PRO_SET_8",
];

export const pointTypeValues = [
  "ACE",
  "WINNER",
  "FORCED_ERROR",
  "UNFORCED_ERROR",
  "DOUBLE_FAULT",
  "FAULT_FIRST",
  "FAULT_SECOND",
];

export const annotationSessionStatusValues = ["IN_PROGRESS", "COMPLETED", "ABANDONED"];

export const validRally = {
  vencedor: "sacador",
  situacao: "saque",
  tipo: "winner",
  golpe: "saque",
  previewBalls: 1,
};

export const fullRally = {
  ...validRally,
  direcao: "cruzada",
  efeito: "topspin",
  golpe_esp: "lob",
  subtipo1: "passing_shot",
  subtipo2: "out",
  duracao: "opcao_1",
  rallyLength: 10,
  note: "great point",
};

export const validUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Admin User",
  email: "admin@test.com",
  cpf: "12345678901",
  role: "ADMIN",
};

export const tiebreakSet = {
  player1: 6,
  player2: 6,
  isTiebreak: true,
  tiebreakScore: { player1: 7, player2: 5 },
};

export const validScoreState = {
  sets: [{ player1: 6, player2: 4 }],
  currentGame: { player1: 0, player2: 0 },
  server: "player1",
  isFinished: false,
  winner: null,
};

export const validMatch = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  format: "BEST_OF_3",
  state: "SCHEDULED",
  player1: { id: "seed_p1", name: "Player 1" },
  player2: { id: "seed_p2", name: "Player 2" },
  scoreState: null,
  scheduledAt: null,
  startedAt: null,
  finishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const fullCreatePlayer = {
  name: "Carlos",
  email: "c@test.com",
  gender: "MALE",
  age: 20,
  dominance: "RIGHT",
  backhand: "TWO_HANDED",
  club: "RKT",
};

export const validCreateUser = {
  name: "Admin",
  email: "admin@test.com",
  cpf: "12345678901",
  password: "123456",
  role: "ADMIN",
};

export const validCreateMatch = {
  player1Id: "player-1",
  player2Id: "player-2",
  format: "BEST_OF_3",
};

export const fullCreateMatch = {
  ...validCreateMatch,
  tournamentName: "Open",
  category: "U18",
  scheduledAt: "2026-09-01T10:00:00Z",
};

export const fullFinishMatch = {
  reason: "ABANDONED",
  note: "player left",
  winnerId: "550e8400-e29b-41d4-a716-446655440000",
  isManualScoreEdit: true,
  version: 1,
};

export const validArrangement = {
  afterSet: 1,
  version: 5,
  serveOrder: {
    player1: ["p1", "p1p"],
    player2: ["p2", "p2p"],
  },
  receiveDeuce: {
    player1: "p1",
    player2: "p2",
  },
};

export const aliasedArrangement = {
  setIndex: 2,
  expectedVersion: 10,
  serveOrder: {
    player1: ["p1", "p1p"],
    player2: ["p2", "p2p"],
  },
  receiveDeuce: {
    player1: "p1p",
    player2: "p2p",
  },
};

/** data do SafeParseSuccess (o assert anterior de success garante o ramo). */
export function parsedData(result: any): any {
  return result.data;
}

/** message do primeiro issue de erro (o assert anterior garante !success). */
export function parsedError(result: any): string {
  return result.error.issues[0].message;
}
