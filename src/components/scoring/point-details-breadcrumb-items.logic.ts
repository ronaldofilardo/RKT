import type { PointDetailsForm } from './point-details-logic';
import {
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  GOLPE_LABELS,
  EFEITO_OPTIONS,
  DIRECAO_LABELS,
  DURACAO_OPTIONS,
  SUBTIPO1_OPTIONS,
} from './point-details-logic';

export type BreadcrumbStep =
  | 'situacao'
  | 'tipo'
  | 'golpe'
  | 'subtipo1'
  | 'efeito'
  | 'direcao'
  | 'duracao';

export interface BreadcrumbItem {
  key: BreadcrumbStep;
  label: string;
}

export function buildBreadcrumbItems(form: PointDetailsForm): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  if (form.situacao) {
    const opt = SITUACAO_OPTIONS.find((o) => o.value === form.situacao);
    items.push({ key: 'situacao', label: opt?.label ?? form.situacao });
  }

  if (form.tipo) {
    items.push({ key: 'tipo', label: TIPO_LABELS[form.tipo] ?? form.tipo });
  }

  if (form.golpe) {
    items.push({ key: 'golpe', label: GOLPE_LABELS[form.golpe] ?? form.golpe });
  }

  if (form.subtipo1) {
    const opt = SUBTIPO1_OPTIONS.find((o) => o.value === form.subtipo1);
    items.push({ key: 'subtipo1', label: opt?.label ?? form.subtipo1 });
  }

  if (form.efeito) {
    const opt = EFEITO_OPTIONS.find((o) => o.value === form.efeito);
    items.push({ key: 'efeito', label: opt?.label ?? form.efeito });
  }

  if (form.direcao) {
    items.push({ key: 'direcao', label: DIRECAO_LABELS[form.direcao] ?? form.direcao });
  }

  if (form.duracao) {
    const opt = DURACAO_OPTIONS.find((o) => o.value === form.duracao);
    items.push({ key: 'duracao', label: opt?.label ?? `${form.duracao} golpes` });
  }

  return items;
}
