import type {
  RallySituacao,
  RallyTipo,
  RallyGolpe,
  RallySubtipo1,
  RallyEfeito,
  RallyDirecao,
  RallyGolpeEsp,
  RallyDuration,
} from '@/core/scoring/types';

export const SITUACAO_OPTIONS: { value: RallySituacao; label: string }[] = [
  { value: 'devolucao', label: 'Devolução de Saque' },
  { value: 'fundo', label: 'Fundo de Quadra' },
  { value: 'passada', label: 'Passada' },
  { value: 'rede', label: 'Rede' },
];

export const TIPO_LABELS: Record<RallyTipo, string> = {
  winner: 'Winner',
  erro_nao_forcado: 'Erro Não Forçado',
  erro_forcado: 'Erro Forçado',
  dupla_falta: 'Dupla Falta',
};

export const TIPO_DESCRIPTIONS: Record<RallyTipo, string> = {
  winner: 'Venceu com uma bola ganhadora, sem erro do adversário',
  erro_nao_forcado: 'Errou sem pressão do adversário (erro próprio)',
  erro_forcado: 'Errou em decorrência de pressão adversária (erro forçado)',
  dupla_falta: 'Dupla falta do sacador (duas faltas consecutivas)',
};

export const GOLPE_LABELS: Record<RallyGolpe, string> = {
  fh: 'Forehand (FH)',
  bh: 'Backhand (BH)',
  vfh: 'Voleio FH',
  vbh: 'Voleio BH',
  smash: 'Smash',
  saque: 'Saque',
  approach_fh: 'Aproach FH',
  approach_bh: 'Aproach BH',
};

export const SUBTIPO1_OPTIONS: { value: RallySubtipo1; label: string }[] = [
  { value: 'passing_shot', label: 'Passing Shot' },
  { value: 'devolucao_saque', label: 'Devolução de Saque' },
];

// "Onde Errou?" (subtipo2) foi removido da cascata de passada + erro:
// pergunta redundante — o tipo de erro já indica onde a bola parou. O campo
// subtipo2 permanece no form/payload porque a Dupla Falta o preenche via
// createDoubleFaultRallyDetails.

export const DURACAO_OPTIONS: { value: RallyDuration; label: string }[] = [
  { value: 'opcao_2', label: '5-8 bolas' },
  { value: 'opcao_3', label: '+9 bolas' },
];

export const EFEITO_OPTIONS: { value: RallyEfeito; label: string }[] = [
  { value: 'topspin', label: 'Topspin' },
  { value: 'slice', label: 'Slice' },
  { value: 'flat', label: 'Flat' },
];

export const DIRECAO_LABELS: Record<RallyDirecao, string> = {
  cruzada: 'Cruzada',
  paralela: 'Paralela',
  centro: 'Centro',
  inside_out: 'Inside-out',
  inside_in: 'Inside-in',
  aberto: 'Aberto',
  fechado: 'Fechado',
};

export const GOLPE_ESP_LABELS: Record<RallyGolpeEsp, string> = {
  lob: 'Lob',
  drop_shot: 'Drop Shot',
  bate_pronto: 'Bate-pronto',
  swing_volley: 'Swing Volley',
};
