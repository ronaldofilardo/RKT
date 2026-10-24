import type { PointDetailsForm, Vencedor } from './point-details-logic';
import {
  getGolpeEspOptions,
  shouldShowDuracao,
  shouldShowEfeito,
  shouldShowSubtipo1,
} from './point-details-logic';

/**
 * Etapas da cascata do modal "Detalhes do ponto", na ORDEM em que são
 * renderizadas pelo SectionRenderer.
 */
export type StepKey =
  | 'situacao'
  | 'tipo'
  | 'golpe'
  | 'subtipo1'
  | 'efeito'
  | 'direcao'
  | 'golpeEsp'
  | 'duracao';

export const STEP_ORDER: readonly StepKey[] = [
  'situacao',
  'tipo',
  'golpe',
  'subtipo1',
  'efeito',
  'direcao',
  'golpeEsp',
  'duracao',
];

/** Espelha as condições de renderização do SectionRenderer. */
export function isStepVisible(step: StepKey, form: PointDetailsForm, vencedor: Vencedor): boolean {
  const { situacao, tipo, golpe } = form;
  switch (step) {
    case 'situacao':
      return true;
    case 'tipo':
      return situacao != null;
    case 'golpe':
      return situacao != null && tipo != null;
    case 'subtipo1':
      return situacao != null && tipo != null && golpe != null && shouldShowSubtipo1(vencedor, situacao, tipo);
    case 'efeito':
      return (
        situacao != null &&
        tipo != null &&
        golpe != null &&
        shouldShowEfeito(vencedor, situacao, tipo, Boolean(form.subtipo1), Boolean(form.subtipo2))
      );
    case 'direcao':
      return golpe != null;
    case 'golpeEsp':
      return (
        golpe != null &&
        getGolpeEspOptions(
          golpe,
          form.efeito,
          vencedor,
          situacao ?? 'fundo',
          tipo ?? 'winner',
          form.subtipo2,
          form.direcao,
        ).length > 0
      );
    case 'duracao':
      return shouldShowDuracao(situacao, golpe, form.subtipo1);
    default:
      return false;
  }
}
