import { z } from "zod";

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
