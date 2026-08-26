import type { PointDetailsForm, Vencedor } from './point-details-logic';
import {
  DURACAO_OPTIONS,
  DIRECAO_LABELS,
  EFEITO_OPTIONS,
  GOLPE_ESP_LABELS,
  GOLPE_LABELS,
  SITUACAO_OPTIONS,
  SUBTIPO1_OPTIONS,
  SUBTIPO2_OPTIONS,
  TIPO_DESCRIPTIONS,
  TIPO_LABELS,
  getGolpeOptions,
  getTipoOptions,
  shouldShowDuracao,
  shouldShowEfeito,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
} from './point-details-logic';
import { Section } from './point-details-section';
import { Pills } from './pills-component';
import type { SectionRendererProps } from './SectionRenderer';
import type { RallyDirecao, RallyGolpeEsp } from '@/core/scoring/types';

type Dispatch = SectionRendererProps['dispatch'];
type Refs = SectionRendererProps['refs'];

function labelMap(options: Array<{ value: string; label: string }>) {
  return Object.fromEntries(options.map((option) => [option.value, option.label])) as Record<string, string>;
}

export function SituationSection({ form, dispatch }: { form: PointDetailsForm; dispatch: Dispatch }) {
  return <Section num="1" label="Situação do Ponto"><Pills options={SITUACAO_OPTIONS.map((option) => option.value)} selected={form.situacao} onChange={(value) => dispatch({ type: 'SET_SITUACAO', value })} labelMap={labelMap(SITUACAO_OPTIONS)} /></Section>;
}

export function TipoSection({ form, vencedor, dispatch, refs }: { form: PointDetailsForm; vencedor: Vencedor; dispatch: Dispatch; refs: Refs }) {
  if (!form.situacao) return null;
  const options = getTipoOptions(vencedor, form.situacao);
  return <Section num="2" label="Resultado do Ponto" ref={refs.tipoRef}><Pills options={options} selected={form.tipo} onChange={(value) => dispatch({ type: 'SET_TIPO', value })} labelMap={TIPO_LABELS} /><p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{form.tipo ? TIPO_DESCRIPTIONS[form.tipo] : 'Selecione como o ponto terminou'}</p></Section>;
}

export function GolpeSection({ form, vencedor, dispatch, refs }: { form: PointDetailsForm; vencedor: Vencedor; dispatch: Dispatch; refs: Refs }) {
  if (!form.situacao || !form.tipo) return null;
  return <Section num="3" label="Golpe" ref={refs.golpeRef}><Pills options={getGolpeOptions(vencedor, form.situacao, form.tipo)} selected={form.golpe} onChange={(value) => dispatch({ type: 'SET_GOLPE', value })} labelMap={GOLPE_LABELS} /></Section>;
}

export function Subtipo1Section({ form, vencedor, dispatch, refs }: { form: PointDetailsForm; vencedor: Vencedor; dispatch: Dispatch; refs: Refs }) {
  if (!form.situacao || !form.tipo || !form.golpe || !shouldShowSubtipo1(vencedor, form.situacao, form.tipo)) return null;
  return <Section num="4" label="Tipo de Erro (Rede)" ref={refs.subtipo1Ref}><Pills options={SUBTIPO1_OPTIONS.map((option) => option.value)} selected={form.subtipo1} onChange={(value) => dispatch({ type: 'SET_SUBTIPO1', value })} labelMap={labelMap(SUBTIPO1_OPTIONS)} /></Section>;
}

export function Subtipo2Section({ form, dispatch, refs, needsSubtipo1 }: { form: PointDetailsForm; dispatch: Dispatch; refs: Refs; needsSubtipo1: boolean }) {
  if (!form.situacao || !form.tipo || !form.golpe || !shouldShowSubtipo2(form.situacao, form.tipo, form.golpe)) return null;
  return <Section num={needsSubtipo1 ? '5' : '4'} label="Onde Errou?" ref={refs.subtipo2Ref}><Pills options={SUBTIPO2_OPTIONS.map((option) => option.value)} selected={form.subtipo2} onChange={(value) => dispatch({ type: 'SET_SUBTIPO2', value })} labelMap={labelMap(SUBTIPO2_OPTIONS)} /></Section>;
}

export function EfeitoSection({ form, vencedor, dispatch, refs, needsSubtipo1, needsSubtipo2 }: { form: PointDetailsForm; vencedor: Vencedor; dispatch: Dispatch; refs: Refs; needsSubtipo1: boolean; needsSubtipo2: boolean }) {
  if (!form.golpe || !form.situacao || !form.tipo || !shouldShowEfeito(vencedor, form.situacao, form.tipo, Boolean(form.subtipo1), Boolean(form.subtipo2))) return null;
  const num = needsSubtipo1 && needsSubtipo2 ? '6' : needsSubtipo1 || needsSubtipo2 ? '5' : '4';
  return <Section num={num} label="Efeito" ref={refs.efeitoRef}><Pills options={EFEITO_OPTIONS.map((option) => option.value)} selected={form.efeito} onChange={(value) => dispatch({ type: 'SET_EFEITO', value })} labelMap={labelMap(EFEITO_OPTIONS)} /></Section>;
}

export function DirecaoSection({ form, dispatch, direcaoOptions, isBlocked }: { form: PointDetailsForm; dispatch: Dispatch; direcaoOptions: RallyDirecao[]; isBlocked: boolean }) {
  if (!form.golpe) return null;
  return <Section num="" label="Direção"><Pills options={direcaoOptions} selected={isBlocked ? null : form.direcao} onChange={(value) => dispatch({ type: 'SET_DIRECAO', value })} labelMap={DIRECAO_LABELS} /></Section>;
}

export function GolpeEspSection({ form, dispatch, options }: { form: PointDetailsForm; dispatch: Dispatch; options: RallyGolpeEsp[] }) {
  if (!options.length) return null;
  return <Section num="" label="Golpe Especial"><Pills options={options} selected={form.golpeEsp} onChange={(value) => dispatch({ type: 'SET_GOLPE_ESP', value })} labelMap={GOLPE_ESP_LABELS} /></Section>;
}

export function DuracaoSection({ form, dispatch, refs, needsSubtipo1, needsSubtipo2, needsEfeito }: { form: PointDetailsForm; dispatch: Dispatch; refs: Refs; needsSubtipo1: boolean; needsSubtipo2: boolean; needsEfeito: boolean }) {
  if (!shouldShowDuracao(form.situacao, form.golpe)) return null;
  const num = String(3 + Number(needsSubtipo1) + Number(needsSubtipo2) + Number(needsEfeito) + 1);
  return <Section num={num} label="Duração do Rallye" ref={refs.duracaoRef}><Pills options={DURACAO_OPTIONS.map((option) => option.value)} selected={form.duracao} onChange={(value) => dispatch({ type: 'SET_DURACAO', value })} labelMap={labelMap(DURACAO_OPTIONS)} /></Section>;
}
