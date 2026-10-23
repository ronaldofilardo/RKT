import type {
  RallyDetails as ContractRallyDetails,
  RallySituacao as ContractRallySituacao,
  RallyTipo as ContractRallyTipo,
  RallyGolpe as ContractRallyGolpe,
  RallySubtipo1 as ContractRallySubtipo1,
  RallySubtipo2 as ContractRallySubtipo2,
  RallyEfeito as ContractRallyEfeito,
  RallyDirecao as ContractRallyDirecao,
  RallyGolpeEsp as ContractRallyGolpeEsp,
  RallyDuration as ContractRallyDuration,
} from '@/schemas/contracts';

export type RallySituacao = ContractRallySituacao;
export type RallyTipo = ContractRallyTipo;
export type RallyGolpe = ContractRallyGolpe;
export type RallySubtipo1 = ContractRallySubtipo1;
export type RallySubtipo2 = ContractRallySubtipo2;
export type RallyEfeito = ContractRallyEfeito;
export type RallyDirecao = ContractRallyDirecao;
export type RallyGolpeEsp = ContractRallyGolpeEsp;
export type RallyDuration = ContractRallyDuration;

export type RallyDetails = ContractRallyDetails;

/**
 * RallyDetails acrescido da atribuição de golpe/recepção escolhida no
 * modal de detalhes do ponto. `RallyDetails` (contrato) não contém esses
 * campos — eles trafegam separadamente em `PointFlow.hitterId/receiverId`
 * e em `annotations`. Tipado aqui para eliminar os casts `as any` na
 * cadeia modal → point-processor (R-06).
 */
export type RallyDetailsWithAttribution = RallyDetails & {
  hitterId?: string;
  receiverId?: string;
};
