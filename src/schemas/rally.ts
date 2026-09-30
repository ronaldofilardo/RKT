import { z } from "zod";
import { flexibleIdValidator } from "./common";

export const VencedorSchema = z.enum(["sacador", "devolvedor"]);
export type Vencedor = z.infer<typeof VencedorSchema>;

export const RallySituacaoSchema = z.enum([
  "devolucao",
  "fundo",
  "passada",
  "rede",
  "saque",
]);
export type RallySituacao = z.infer<typeof RallySituacaoSchema>;

export const RallyTipoSchema = z.enum([
  "erro_nao_forcado",
  "erro_forcado",
  "winner",
  "dupla_falta",
]);
export type RallyTipo = z.infer<typeof RallyTipoSchema>;

export const RallyGolpeSchema = z.enum(["fh", "bh", "vfh", "vbh", "smash", "saque"]);
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
  "aberto",
  "fechado",
]);
export type RallyDirecao = z.infer<typeof RallyDirecaoSchema>;

export const RallyGolpeEspSchema = z.enum([
  "lob",
  "drop_shot",
  "bate_pronto",
  "swing_volley",
]);
export type RallyGolpeEsp = z.infer<typeof RallyGolpeEspSchema>;

export const RallyDurationSchema = z.enum(["opcao_1", "opcao_2", "opcao_3"]);
export type RallyDuration = z.infer<typeof RallyDurationSchema>;

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
  duracao: RallyDurationSchema.optional(),
  previewBalls: z.number().int().min(0),
  rallyLength: z.number().int().min(0).optional(),
  note: z.string().max(500).optional(),
});
export type RallyDetails = z.infer<typeof RallyDetailsSchema>;

export const PointTypeSchema = z.enum([
  "ACE",
  "WINNER",
  "FORCED_ERROR",
  "UNFORCED_ERROR",
  "DOUBLE_FAULT",
  "FAULT_FIRST",
  "FAULT_SECOND",
]);
export type PointType = z.infer<typeof PointTypeSchema>;

export const PointFlowInputSchema = z.object({
  winnerId: flexibleIdValidator,
  type: PointTypeSchema,
  serverId: flexibleIdValidator,
  timestamp: z.number().optional(),
  sequenceNumber: z.number().int().positive().optional(),
  clientEventId: z.string().min(1).max(128).optional(),
  isFirstServe: z.boolean().optional(),
  isSecondServe: z.boolean().optional(),
  isLet: z.boolean().optional(),
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
      note: z.string().max(500).optional(),
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
