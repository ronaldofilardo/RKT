'use client';

import type { PointDetailsForm, Action } from './point-details-logic';
import {
  shouldShowDuracao,
  EFEITO_OPTIONS,
  DURACAO_OPTIONS,
  DIRECAO_LABELS,
  GOLPE_ESP_LABELS,
  SUBTIPO1_OPTIONS,
} from './point-details-logic';
import { Section } from './point-details-section';
import { Pills, toLabelMap } from './pills-component';
import type { SectionRendererComputed } from './section-renderer.logic';

interface PointDetailsCascadeProps {
  form: PointDetailsForm;
  dispatch: React.Dispatch<Action>;
  refs: {
    subtipo1Ref: React.RefObject<HTMLDivElement>;
    efeitoRef: React.RefObject<HTMLDivElement>;
    direcaoRef?: React.RefObject<HTMLDivElement>;
    golpeEspRef?: React.RefObject<HTMLDivElement>;
    duracaoRef: React.RefObject<HTMLDivElement>;
  };
  computed: SectionRendererComputed;
}

export function PointDetailsCascadeSections({ form, dispatch, refs, computed }: PointDetailsCascadeProps) {
  const { needsSubtipo1, needsEfeito, isDirecaoBlocked, direcaoOptions, golpeEspOptions } = computed;

  return (
    <>
      {needsSubtipo1 && form.golpe && (
        <Section num="4" label="Tipo de Erro (Rede)" ref={refs.subtipo1Ref}>
          <Pills
            options={SUBTIPO1_OPTIONS.map(o => o.value)}
            selected={form.subtipo1}
            onChange={v => dispatch({ type: 'SET_SUBTIPO1', value: v })}
            labelMap={toLabelMap(SUBTIPO1_OPTIONS)}
          />
        </Section>
      )}

      {needsEfeito && form.golpe && (
        <Section num={needsSubtipo1 ? '5' : '4'} label="Efeito" ref={refs.efeitoRef}>
          <Pills
            options={EFEITO_OPTIONS.map(o => o.value)}
            selected={form.efeito}
            onChange={v => dispatch({ type: 'SET_EFEITO', value: v })}
            labelMap={toLabelMap(EFEITO_OPTIONS)}
          />
        </Section>
      )}

      {form.golpe && (
        <Section num="" label="Direção" ref={refs.direcaoRef}>
          <Pills
            options={direcaoOptions}
            selected={isDirecaoBlocked ? null : form.direcao}
            onChange={v => dispatch({ type: 'SET_DIRECAO', value: v })}
            labelMap={DIRECAO_LABELS}
          />
        </Section>
      )}

      {golpeEspOptions.length > 0 && (
        <Section num="" label="Golpe Especial" ref={refs.golpeEspRef}>
          <Pills
            options={golpeEspOptions}
            selected={form.golpeEsp}
            onChange={v => dispatch({ type: 'SET_GOLPE_ESP', value: v })}
            labelMap={GOLPE_ESP_LABELS}
          />
        </Section>
      )}

      {shouldShowDuracao(form.situacao, form.golpe, form.subtipo1) && (
        <Section
          num={String(3 + (needsSubtipo1 ? 1 : 0) + (needsEfeito ? 1 : 0) + 1)}
          label="Duração do Rallye"
          ref={refs.duracaoRef}
        >
          <Pills
            options={DURACAO_OPTIONS.map(o => o.value)}
            selected={form.duracao}
            onChange={v => dispatch({ type: 'SET_DURACAO', value: form.duracao === v ? null : v })}
            labelMap={toLabelMap(DURACAO_OPTIONS)}
          />
        </Section>
      )}
    </>
  );
}
