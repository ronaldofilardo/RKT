import {
  getDirecaoOptions,
  getGolpeEspOptions,
  shouldShowEfeito,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
} from './point-details-logic';
import type { SectionRendererProps } from './SectionRenderer';

export interface SectionRenderState {
  needsSubtipo1: boolean;
  needsSubtipo2: boolean;
  needsEfeito: boolean;
  isDirecaoBlocked: boolean;
  direcaoOptions: any[];
  golpeEspOptions: any[];
}

function needsSubtipo1(props: SectionRendererProps): boolean {
  const { form, vencedor } = props;
  return Boolean(form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo));
}

function needsSubtipo2(props: SectionRendererProps): boolean {
  const { form } = props;
  return Boolean(form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe));
}

function needsEfeito(props: SectionRendererProps): boolean {
  const { form, vencedor } = props;
  return Boolean(form.golpe && form.situacao && form.tipo && shouldShowEfeito(vencedor, form.situacao, form.tipo, Boolean(form.subtipo1), Boolean(form.subtipo2)));
}

function getDirectionOptions(props: SectionRendererProps): any[] {
  const { form } = props;
  return form.efeito || form.situacao ? getDirecaoOptions(form.efeito, form.situacao ?? 'fundo', form.tipo ?? 'winner') : [];
}

function getSpecialStrokeOptions(props: SectionRendererProps): any[] {
  const { form, vencedor } = props;
  return form.golpe ? getGolpeEspOptions(form.golpe, form.efeito, vencedor, form.situacao ?? 'fundo', form.tipo ?? 'winner', form.subtipo2, form.direcao) : [];
}

export function getSectionRenderState(props: SectionRendererProps): SectionRenderState {
  const subtipo1 = needsSubtipo1(props);
  const subtipo2 = needsSubtipo2(props);
  const efeito = needsEfeito(props);
  return {
    needsSubtipo1: subtipo1,
    needsSubtipo2: subtipo2,
    needsEfeito: efeito,
    isDirecaoBlocked: props.form.efeito == null && efeito,
    direcaoOptions: getDirectionOptions(props),
    golpeEspOptions: getSpecialStrokeOptions(props),
  };
}
