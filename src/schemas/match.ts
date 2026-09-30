import { z } from "zod";
import { flexibleIdValidator } from "./common";
import { PlayerSchema } from "./player";

export const MatchStateSchema = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
]);
export type MatchState = z.infer<typeof MatchStateSchema>;

export const MatchFinishReasonSchema = z.enum([
  "COMPLETED",
  "ABANDONED",
  "WALKOVER",
  "INJURY",
  "OUTRO",
]);
export type MatchFinishReason = z.infer<typeof MatchFinishReasonSchema>;

export const MatchFormatSchema = z.enum([
  "BEST_OF_3",
  "BEST_OF_3_MATCH_TB",
  "BEST_OF_3_NO_AD",
  "BEST_OF_5",
  "SHORT_SET_2V2_NO_AD",
  "MATCH_TB_10",
  "PRO_SET_8",
]);
export type MatchFormat = z.infer<typeof MatchFormatSchema>;

export const GameScoreSchema = z.object({
  player1: z.number().int().min(0),
  player2: z.number().int().min(0),
  isDeuce: z.boolean().optional(),
  advantage: z.enum(["player1", "player2"]).nullable().optional(),
  secondServe: z.boolean().optional(),
});

export const SetScoreSchema = z.object({
  player1: z.number().int().min(0),
  player2: z.number().int().min(0),
  isTiebreak: z.boolean().optional(),
  tiebreakScore: z
    .object({ player1: z.number().int().min(0), player2: z.number().int().min(0) })
    .nullable()
    .optional(),
});

export const MatchScoreStateSchema = z.object({
  sets: z.array(SetScoreSchema),
  currentGame: GameScoreSchema,
  server: z.enum(["player1", "player2"]),
  isFinished: z.boolean(),
  winner: z.enum(["player1", "player2"]).nullable(),
  setsWon: z
    .object({
      player1: z.number().int().min(0),
      player2: z.number().int().min(0),
    })
    .optional(),
  startedAt: z.number().nullable().optional(),
  secondServe: z.boolean().optional(),
  /**
   * Histórico detalhado de pontos (com rallyDetails, firstFaultDetail,
   * etc.) gerado pelo ScoringEngine. Persistido junto do estado para
   * alimentar o relatório pós-partida. Opcional pois snapshots legados
   * (e estados criados via edit-score) podem não contê-lo.
   */
  history: z
    .array(
      z.object({
        stateBefore: z.unknown(),
        point: z.unknown(),
      })
    )
    .optional(),
});
export type MatchScoreState = z.infer<typeof MatchScoreStateSchema>;

/**
 * Snapshot persistido pelo fluxo edit-score quando `history` está
 * disponível no cliente (formato `{ state, history }` aceito por
 * `ScoringEngine.fromSerialized`). Quando `history` está ausente, o
 * cliente envia apenas `MatchScoreStateSchema` (legado).
 * Ver `useScoringHandlers.persistence.ts:73` e `engine.state.ts:52`.
 */
export const MatchScoreStateEnvelopeSchema = z.object({
  state: MatchScoreStateSchema,
  history: z
    .array(
      z.object({
        stateBefore: z.unknown(),
        point: z.unknown(),
      })
    )
    .optional(),
});
export type MatchScoreStateEnvelope = z.infer<typeof MatchScoreStateEnvelopeSchema>;

export const MatchSchema = z.object({
  id: flexibleIdValidator,
  format: MatchFormatSchema,
  state: MatchStateSchema,
  player1: PlayerSchema,
  player2: PlayerSchema,
  scoreState: MatchScoreStateSchema.nullable(),
  scheduledAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  finishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Match = z.infer<typeof MatchSchema>;

export const CreateMatchInputSchema = z
  .object({
    player1Id: z.string().min(1),
    player2Id: z.string().min(1),
    format: MatchFormatSchema,
    sportType: z.string().nullish(),
    courtType: z.string().nullish(),
    nickname: z.string().nullish(),
    visibility: z.string().nullish(),
    openForAnnotation: z.boolean().nullish(),
    scheduledAt: z.coerce.date().nullish(),
    initialServerId: z.string().min(1).nullish(),
    tournamentName: z.string().nullish(),
    category: z.string().nullish(),
    round: z.string().nullish(),
    roundName: z.string().nullish(),
    bracketType: z.string().nullish(),
    temperature: z.number().nullish(),
    humidity: z.number().nullish(),
    force: z.boolean().optional(),
  })
  .refine((data) => data.player1Id !== data.player2Id, {
    message: "Jogador 2 deve ser diferente do Jogador 1",
    path: ["player2Id"],
  });
export type CreateMatchInput = z.infer<typeof CreateMatchInputSchema>;

export const DeleteMatchInputSchema = z.object({
  type: z.enum(['soft', 'hard']),
  reason: z.string().max(500).optional(),
});
export type DeleteMatchInput = z.infer<typeof DeleteMatchInputSchema>;

export const FinishMatchInputSchema = z.object({
  reason: MatchFinishReasonSchema,
  note: z.string().max(500).optional(),
  scoreState: MatchScoreStateSchema.optional(),
  version: z.number().int().optional(),
  // Bug (2026-09-06): campo ausente do schema fazia o Zod descartar
  // silenciosamente o `winnerId` enviado pelo cliente ao finalizar uma
  // partida via "Editar Placar" — o vencedor nunca era persistido no banco
  // (diferente do fluxo de pontuação ao vivo, que grava winnerId
  // corretamente via POST /point). Ver também route.ts, que agora repassa
  // este campo para matchService.finishMatch.
  winnerId: flexibleIdValidator.optional(),
  // true somente quando esta chamada de finalização vem do fluxo
  // "Editar Placar" (retomada de partida interrompida) — instrui o backend
  // a registrar o segmento anterior em MatchScoreEdit antes de sobrescrever
  // o scoreState, para que /report reconstrua a timeline corretamente.
  isManualScoreEdit: z.boolean().optional(),
});
export type FinishMatchInput = z.infer<typeof FinishMatchInputSchema>;

export const MatchStateInputSchema = z
  .object({
    state: MatchStateSchema,
    initialServerId: z.string().min(1).optional(),
    scoreState: z
      .union([MatchScoreStateEnvelopeSchema, MatchScoreStateSchema])
      .optional(),
    version: z.number().int().optional(),
    allowScoreEdit: z.boolean().optional(),
    /**
     * true somente quando a mudança de placar vem do fluxo "Editar Placar"
     * (retomada de partida interrompida). Diferente de um `undo` comum,
     * este flag instrui o backend a preservar o `scoreState` anterior
     * (com seu `history` completo) em `MatchScoreEdit` antes de
     * sobrescrevê-lo, para que a timeline do /report não perca o trecho
     * já anotado antes da correção manual.
     */
    isManualScoreEdit: z.boolean().optional(),
    note: z.string().max(500).optional(),
    /**
     * ID do PointLog a ser anulado atomicamente junto com a transição de
     * estado (usado no fluxo de Undo para evitar discrepâncias entre
     * pointLog e match.scoreState caso haja falha ou conflito de versão).
     */
    voidPointLogId: flexibleIdValidator.optional(),
    voidLastPoint: z.boolean().optional(),
    isUndo: z.boolean().optional(),
  })
  .refine((data) => data.state !== "SCHEDULED", {
    message: "Não é possível voltar para SCHEDULED via API",
  });
export type MatchStateInput = z.infer<typeof MatchStateInputSchema>;
