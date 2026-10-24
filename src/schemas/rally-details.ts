import { z } from "zod";
import {
  VencedorSchema,
  RallySituacaoSchema,
  RallyTipoSchema,
  RallyGolpeSchema,
  RallySubtipo1Schema,
  RallySubtipo2Schema,
  RallyEfeitoSchema,
  RallyDirecaoSchema,
  RallyGolpeEspSchema,
  RallyDurationSchema,
} from "./rally-enums";

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
