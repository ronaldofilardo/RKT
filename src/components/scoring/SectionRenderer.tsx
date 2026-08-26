'use client';

import type { PointDetailsForm, Vencedor } from './point-details-logic';
import {
  getTipoOptions,
  getGolpeOptions,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
  shouldShowEfeito,
  shouldShowDuracao,
  getDirecaoOptions,
  getGolpeEspOptions,
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  TIPO_DESCRIPTIONS,
  GOLPE_LABELS,
  SUBTIPO1_OPTIONS,
  SUBTIPO2_OPTIONS,
  EFEITO_OPTIONS,
  DURACAO_OPTIONS,
  DIRECAO_LABELS,
  GOLPE_ESP_LABELS,
} from './point-details-logic';
import { Section } from './point-details-section';
import { Pills } from './pills-component';

export interface SectionRendererProps {
  form: PointDetailsForm;
  vencedor: Vencedor;
  dispatch: React.Dispatch<any>;
  refs: {
    tipoRef: React.RefObject<HTMLDivElement>;
    golpeRef: React.RefObject<HTMLDivElement>;
    duracaoRef: React.RefObject<HTMLDivElement>;
    subtipo1Ref: React.RefObject<HTMLDivElement>;
    subtipo2Ref: React.RefObject<HTMLDivElement>;
    efeitoRef: React.RefObject<HTMLDivElement>;
  };
}

export function SectionRenderer({
  form,
  vencedor,
  dispatch,
  refs,
}: SectionRendererProps) {
  const needsSubtipo1 = form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo);
  const needsSubtipo2 = form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe);
  const needsEfeito = form.golpe != null && shouldShowEfeito(vencedor, form.situacao!, form.tipo!, !!form.subtipo1, !!form.subtipo2);
  const isDirecaoBlocked = form.efeito == null && needsEfeito;

  const direcaoOptions = form.efeito || form.situacao ? getDirecaoOptions(form.efeito, form.situacao ?? 'fundo', form.tipo ?? 'winner') : [];
  const golpeEspOptions = form.golpe ? getGolpeEspOptions(form.golpe, form.efeito, vencedor, form.situacao ?? 'fundo', form.tipo ?? 'winner', form.subtipo2, form.direcao) : [];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-[18px]" data-testid="modal-content">
      <Section num="1" label="Situação do Ponto">
        <Pills
          options={SITUACAO_OPTIONS.map(o => o.value)}
          selected={form.situacao}
          onChange={v => dispatch({ type: 'SET_SITUACAO', value: v })}
          labelMap={Object.fromEntries(SITUACAO_OPTIONS.map(o => [o.value, o.label])) as any}
        />
      </Section>

      {form.situacao && (
        <Section num="2" label="Resultado do Ponto" ref={refs.tipoRef}>
          <Pills
            options={getTipoOptions(vencedor, form.situacao)}
            selected={form.tipo}
            onChange={v => dispatch({ type: 'SET_TIPO', value: v })}
            labelMap={TIPO_LABELS}
          />
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {form.tipo ? TIPO_DESCRIPTIONS[form.tipo] : 'Selecione como o ponto terminou'}
          </p>
        </Section>
      )}

      {form.situacao && form.tipo && (
        <Section num="3" label="Golpe" ref={refs.golpeRef}>
          <Pills
            options={getGolpeOptions(vencedor, form.situacao, form.tipo)}
            selected={form.golpe}
            onChange={v => dispatch({ type: 'SET_GOLPE', value: v })}
            labelMap={GOLPE_LABELS}
          />
        </Section>
      )}

      {needsSubtipo1 && form.golpe && (
        <Section num="4" label="Tipo de Erro (Rede)" ref={refs.subtipo1Ref}>
          <Pills
            options={SUBTIPO1_OPTIONS.map(o => o.value)}
            selected={form.subtipo1}
            onChange={v => dispatch({ type: 'SET_SUBTIPO1', value: v })}
            labelMap={Object.fromEntries(SUBTIPO1_OPTIONS.map(o => [o.value, o.label])) as any}
          />
        </Section>
      )}

      {needsSubtipo2 && form.tipo && (
        <Section num={needsSubtipo1 ? '5' : '4'} label="Onde Errou?" ref={refs.subtipo2Ref}>
          <Pills
            options={SUBTIPO2_OPTIONS.map(o => o.value)}
            selected={form.subtipo2}
            onChange={v => dispatch({ type: 'SET_SUBTIPO2', value: v })}
            labelMap={Object.fromEntries(SUBTIPO2_OPTIONS.map(o => [o.value, o.label])) as any}
          />
        </Section>
      )}

      {needsEfeito && form.golpe && (
        <Section num={
          (needsSubtipo1 && needsSubtipo2) ? '6' :
          (needsSubtipo1 || needsSubtipo2) ? '5' : '4'
        } label="Efeito" ref={refs.efeitoRef}>
          <Pills
            options={EFEITO_OPTIONS.map(o => o.value)}
            selected={form.efeito}
            onChange={v => dispatch({ type: 'SET_EFEITO', value: v })}
            labelMap={Object.fromEntries(EFEITO_OPTIONS.map(o => [o.value, o.label])) as any}
          />
        </Section>
      )}

      {form.golpe && (
        <Section num="" label="Direção">
          <Pills
            options={direcaoOptions}
            selected={isDirecaoBlocked ? null : form.direcao}
            onChange={v => dispatch({ type: 'SET_DIRECAO', value: v })}
            labelMap={DIRECAO_LABELS}
          />
        </Section>
      )}

      {golpeEspOptions.length > 0 && (
        <Section num="" label="Golpe Especial">
          <Pills
            options={golpeEspOptions}
            selected={form.golpeEsp}
            onChange={v => dispatch({ type: 'SET_GOLPE_ESP', value: v })}
            labelMap={GOLPE_ESP_LABELS}
          />
        </Section>
      )}

      {shouldShowDuracao(form.situacao, form.golpe) && (
        <Section
          num={String(
            3
            + (needsSubtipo1 ? 1 : 0)
            + (needsSubtipo2 ? 1 : 0)
            + (needsEfeito ? 1 : 0)
            + 1
          )}
          label="Duração do Rallye"
          ref={refs.duracaoRef}
        >
          <Pills
            options={DURACAO_OPTIONS.map(o => o.value)}
            selected={form.duracao}
            onChange={v => dispatch({ type: 'SET_DURACAO', value: v })}
            labelMap={Object.fromEntries(DURACAO_OPTIONS.map(o => [o.value, o.label])) as any}
          />
        </Section>
      )}
    </div>
  );
}