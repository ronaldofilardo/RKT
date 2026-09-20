import {
  getDirecaoOptions,
  getGolpeEspOptions,
  shouldShowEfeito,
  shouldShowSubtipo1,
} from './point-details-logic';
import type { SectionRendererProps } from './SectionRenderer';
import type { RallyDirecao, RallyGolpeEsp } from '@/core/scoring/types';

export interface SectionRenderState {
  needsSubtipo1: boolean;
  needsEfeito: boolean;
  isDirecaoBlocked: boolean;
  direcaoOptions: RallyDirecao[];
  golpeEspOptions: RallyGolpeEsp[];
}

function needsSubtipo1(props: SectionRendererProps): boolean {
  const { form, vencedor } = props;
  return Boolean(form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo));
}

function needsEfeito(props: SectionRendererProps): boolean {
  const { form, vencedor } = props;
  return Boolean(form.golpe && form.situacao && form.tipo && shouldShowEfeito(vencedor, form.situacao, form.tipo, Boolean(form.subtipo1), Boolean(form.subtipo2)));
}

function getDirectionOptions(props: SectionRendererProps): RallyDirecao[] {
  const { form } = props;
  return form.efeito || form.situacao ? getDirecaoOptions(form.efeito, form.situacao ?? 'fundo', form.tipo ?? 'winner') : [];
}

function getSpecialStrokeOptions(props: SectionRendererProps): RallyGolpeEsp[] {
  const { form, vencedor } = props;
  return form.golpe ? getGolpeEspOptions(form.golpe, form.efeito, vencedor, form.situacao ?? 'fundo', form.tipo ?? 'winner', form.subtipo2, form.direcao) : [];
}

export function getSectionRenderState(props: SectionRendererProps): SectionRenderState {
  const subtipo1 = needsSubtipo1(props);
  const efeito = needsEfeito(props);
  return {
    needsSubtipo1: subtipo1,
    needsEfeito: efeito,
    isDirecaoBlocked: props.form.efeito == null && efeito,
    direcaoOptions: getDirectionOptions(props),
    golpeEspOptions: getSpecialStrokeOptions(props),
  };
}
