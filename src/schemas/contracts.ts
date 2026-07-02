import { z } from "zod";

export const VencedorSchema = z.enum(["sacador", "devolvedor"]);
export type Vencedor = z.infer<typeof VencedorSchema>;

export const RallySituacaoSchema = z.enum([
  "devolucao",
  "fundo",
  "passada",
  "rede",
]);
export type RallySituacao = z.infer<typeof RallySituacaoSchema>;

export const RallyTipoSchema = z.enum([
  "erro_nao_forcado",
  "erro_forcado",
  "winner",
]);
export type RallyTipo = z.infer<typeof RallyTipoSchema>;

export const RallyGolpeSchema = z.enum(["fh", "bh", "vfh", "vbh", "smash"]);
export type RallyGolpe = z.infer<typeof RallyGolpeSchema>;

export const RallySubtipo1Schema = z.enum(["passing_shot", "devolucao_saque"]);
export type RallySubtipo1 = z.infer<typeof RallySubtipo1Schema>;

export const RallySubtipo2Schema = z.enum(["out", "net"]);
export type RallySubtipo2 = z.infer<typeof RallySubtipo2Schema>;

export const RallyEfeitoSchema = z.enum(["topspin", "slice", "flat"]);
export type RallyEfeito = z.infer<typeof RallyEfeitoSchema>;

export const RallyDirecaoSchema = z.enum([
  "cruzada",
  "paralela",
  "centro",
  "inside_out",
  "inside_in",
]);
export type RallyDirecao = z.infer<typeof RallyDirecaoSchema>;

export const RallyGolpeEspSchema = z.enum([
  "lob",
  "drop_shot",
  "bate_pronto",
  "swing_volley",
]);
export type RallyGolpeEsp = z.infer<typeof RallyGolpeEspSchema>;

export const RallyDetailsSchema = z.object({
  vencedor: VencedorSchema,
  situacao: RallySituacaoSchema,
  tipo: RallyTipoSchema,
  golpe: RallyGolpeSchema,
  direcao: RallyDirecaoSchema.optional(),
  efeito: RallyEfeitoSchema.optional(),
  golpe_esp: RallyGolpeEspSchema.optional(),
  subtipo1: RallySubtipo1Schema.optional(),
  subtipo2: RallySubtipo2Schema.optional(),
  previewBalls: z.number().int().min(0),
});
export type RallyDetails = z.infer<typeof RallyDetailsSchema>;

export const RoleSchema = z.enum([
  "ADMIN",
  "GESTOR",
  "COACH",
  "ATHLETE",
  "SPECTATOR",
]);
export type Role = z.infer<typeof RoleSchema>;

export const MatchStateSchema = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
]);
export type MatchState = z.infer<typeof MatchStateSchema>;

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

export const PointTypeSchema = z.enum([
  "ACE",
  "WINNER",
  "FORCED_ERROR",
  "UNFORCED_ERROR",
  "DOUBLE_FAULT",
  "FAULT_SECOND",
]);
export type PointType = z.infer<typeof PointTypeSchema>;

// Accept CUID, UUID, or prefixed UUID formats for ID fields
// CUID: 24-25 chars, no hyphens (e.g., cjs5nqpr7000001l29u6qr9f1)
// UUID: 36 chars, 5 segments 8-4-4-4-12, hex only (e.g., 550e8400-e29b-41d4-a716-446655440000)
// Prefixed UUID: 5 segments where first segment is an alphanumeric prefix
// followed by standard UUID body segments 4-4-4-12
// (e.g., pa2da1636-d6c4-4184-8fca-8dd8d5d8f3f9 or pac07fc77-ffd3-466e-af56-0ffc079d158a)
const flexibleIdValidator = z
  .string()
  .refine(
    (id) =>
      /^[a-z0-9]{24,25}$/.test(id) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ) ||
      /^[a-z0-9]{2,20}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    "Must be a valid CUID, UUID or prefixed UUID",
  );

export const PlayerSchema = z.object({
  id: flexibleIdValidator,
  name: z.string().min(2).max(100),
  role: RoleSchema,
});
export type Player = z.infer<typeof PlayerSchema>;

export const PointFlowInputSchema = z.object({
  winnerId: flexibleIdValidator,
  type: PointTypeSchema,
  serverId: flexibleIdValidator,
  timestamp: z.number().optional(),
  sequenceNumber: z.number().int().positive().optional(),
  isFirstServe: z.boolean().optional(),
  isSecondServe: z.boolean().optional(),
  firstFaultDetail: z
    .object({
      errorType: z.string().optional(),
      serveEffect: z.string().optional(),
      direction: z.string().optional(),
    })
    .optional(),
  rallyDetails: RallyDetailsSchema.optional(),
  rallyLength: z.number().int().optional(),
  annotations: z
    .object({
      zone: z.string().optional(),
      stroke: z.string().optional(),
      note: z.string().max(200).optional(),
      rallyDetails: RallyDetailsSchema.optional(),
      rallyLength: z.number().int().optional(),
      isFirstServe: z.boolean().optional(),
      isSecondServe: z.boolean().optional(),
      firstFaultDetail: z
        .object({
          errorType: z.string().optional(),
          serveEffect: z.string().optional(),
          direction: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type PointFlowInput = z.infer<typeof PointFlowInputSchema>;

export const GameScoreSchema = z.object({
  player1: z.number().int().min(0),
  player2: z.number().int().min(0),
  isDeuce: z.boolean(),
  advantage: z.enum(["player1", "player2"]).nullable(),
});

export const SetScoreSchema = z.object({
  player1: z.number().int().min(0),
  player2: z.number().int().min(0),
  isTiebreak: z.boolean(),
  tiebreakScore: z
    .object({ player1: z.number(), player2: z.number() })
    .nullable(),
});

export const MatchScoreStateSchema = z.object({
  sets: z.array(SetScoreSchema),
  currentGame: GameScoreSchema,
  server: z.enum(["player1", "player2"]),
  isFinished: z.boolean(),
  winner: z.enum(["player1", "player2"]).nullable(),
});
export type MatchScoreState = z.infer<typeof MatchScoreStateSchema>;

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

export const CreateMatchInputSchema = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  format: z.string().min(1),
  sportType: z.string().nullish(),
  courtType: z.string().nullish(),
  nickname: z.string().nullish(),
  visibility: z.string().nullish(),
  openForAnnotation: z.boolean().nullish(),
  scheduledAt: z.coerce.date().nullish(),
  initialServerId: z.string().min(1).nullish(),
  tournamentName: z.string().nullish(),
  round: z.string().nullish(),
  roundName: z.string().nullish(),
  bracketType: z.string().nullish(),
  temperature: z.number().nullish(),
  humidity: z.number().nullish(),
});
export type CreateMatchInput = z.infer<typeof CreateMatchInputSchema>;

export const MatchStateInputSchema = z
  .object({
    state: MatchStateSchema,
    initialServerId: z.string().min(1).optional(),
    scoreState: z.any().optional(),
  })
  .refine((data) => data.state !== "SCHEDULED", {
    message: "Não é possível voltar para SCHEDULED via API",
  });
export type MatchStateInput = z.infer<typeof MatchStateInputSchema>;

export const LoginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

export const QueuedActionSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().cuid(),
  type: z.literal("POINT"),
  payload: PointFlowInputSchema,
  timestamp: z.number(),
  retries: z.number().int().min(0).default(0),
  status: z.enum(["PENDING", "SYNCING", "FAILED"]),
});
export type QueuedAction = z.infer<typeof QueuedActionSchema>;

export const AnnotationSessionStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
]);
export type AnnotationSessionStatus = z.infer<
  typeof AnnotationSessionStatusSchema
>;

export const AnnotationEndorsementSchema = z.object({
  id: flexibleIdValidator,
  sessionId: flexibleIdValidator,
  endorsedByUserId: flexibleIdValidator,
  endorsedAt: z.coerce.date(),
  endorsedBy: z
    .object({
      id: flexibleIdValidator,
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});
export type AnnotationEndorsement = z.infer<typeof AnnotationEndorsementSchema>;

export const AnnotationSessionSchema = z.object({
  id: flexibleIdValidator,
  matchId: flexibleIdValidator,
  annotatorUserId: flexibleIdValidator,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  matchStateSnapshot: z.string().nullable(),
  finalStateSnapshot: z.string().nullable(),
  isActive: z.boolean(),
  status: AnnotationSessionStatusSchema,
  createdAt: z.coerce.date(),
  annotator: z
    .object({
      id: flexibleIdValidator,
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
  endorsements: z.array(AnnotationEndorsementSchema).optional(),
});
export type AnnotationSession = z.infer<typeof AnnotationSessionSchema>;

export const EndSessionInputSchema = z.object({
  status: AnnotationSessionStatusSchema.optional(),
  finalState: z.unknown().optional(),
});
export type EndSessionInput = z.infer<typeof EndSessionInputSchema>;

export const MarkSessionAbandonedInputSchema = z.object({
  matchStateSnapshot: z.string().optional(),
});
export type MarkSessionAbandonedInput = z.infer<
  typeof MarkSessionAbandonedInputSchema
>;

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;
