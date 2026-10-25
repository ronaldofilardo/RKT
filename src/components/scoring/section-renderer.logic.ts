import {
  shouldShowSubtipo1,
  shouldShowEfeito,
  getDirecaoOptions,
  getGolpeEspOptions,
} from './point-details-logic';
import type { PointDetailsForm, Vencedor } from './point-details-logic';

export interface SectionRendererComputed {
  needsSubtipo1: boolean;
  needsEfeito: boolean;
  isDirecaoBlocked: boolean;
  direcaoOptions: ReturnType<typeof getDirecaoOptions>;
  golpeEspOptions: ReturnType<typeof getGolpeEspOptions>;
}

/** Pré-calcula quais seções da cascata devem renderizar e com quais opções. */
export function computeSectionRenderer(
  form: PointDetailsForm,
  vencedor: Vencedor
): SectionRendererComputed {
  const needsSubtipo1 = !!(form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo));
  const needsEfeito = form.golpe != null && shouldShowEfeito(vencedor, form.situacao!, form.tipo!, !!form.subtipo1, !!form.subtipo2, form.golpe);
  const isDirecaoBlocked = form.efeito == null && needsEfeito;

  const direcaoOptions = form.efeito || form.situacao
    ? getDirecaoOptions(form.efeito, form.situacao ?? 'fundo', form.tipo ?? 'winner')
    : [];
  const golpeEspOptions = form.golpe
    ? getGolpeEspOptions(form.golpe, form.efeito, vencedor, form.situacao ?? 'fundo', form.tipo ?? 'winner', form.subtipo2, form.direcao)
    : [];

  return { needsSubtipo1, needsEfeito, isDirecaoBlocked, direcaoOptions, golpeEspOptions };
}
