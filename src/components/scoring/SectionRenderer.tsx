'use client';

import type { PointDetailsForm, Vencedor, Action } from './point-details-logic';
import { getTipoOptions, getGolpeOptions, SITUACAO_OPTIONS, TIPO_LABELS, TIPO_DESCRIPTIONS, GOLPE_LABELS } from './point-details-logic';
import { Section } from './point-details-section';
import { Pills, toLabelMap } from './pills-component';
import { computeSectionRenderer } from './section-renderer.logic';
import { PointDetailsCascadeSections } from './point-details-cascade-sections';

interface SectionRendererProps {
  form: PointDetailsForm;
  vencedor: Vencedor;
  dispatch: React.Dispatch<Action>;
  refs: {
    tipoRef: React.RefObject<HTMLDivElement>;
    golpeRef: React.RefObject<HTMLDivElement>;
    duracaoRef: React.RefObject<HTMLDivElement>;
    subtipo1Ref: React.RefObject<HTMLDivElement>;
    efeitoRef: React.RefObject<HTMLDivElement>;
    direcaoRef?: React.RefObject<HTMLDivElement>;
    golpeEspRef?: React.RefObject<HTMLDivElement>;
    /** Container com overflow-y — usado pelo auto-scroll da cascata. */
    containerRef?: React.RefObject<HTMLDivElement>;
  };
  hitterCandidates?: { id: string; name: string }[];
  receiverCandidates?: { id: string; name: string }[];
}

export function SectionRenderer({ form, vencedor, dispatch, refs, hitterCandidates, receiverCandidates }: SectionRendererProps) {
  const computed = computeSectionRenderer(form, vencedor);

  return (
    <div ref={refs.containerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-[18px]" data-testid="modal-content">
      {receiverCandidates && receiverCandidates.length > 0 && (
        <Section num="⚡" label="Lado de Devolução (Ponto Decisivo)">
          <Pills
            options={receiverCandidates.map(c => c.id)}
            selected={form.receiverId}
            onChange={v => dispatch({ type: 'SET_RECEIVER', value: v })}
            labelMap={Object.fromEntries(receiverCandidates.map(c => [c.id, c.name]))}
          />
        </Section>
      )}

      <Section num="1" label="Situação do Ponto">
        <Pills
          options={SITUACAO_OPTIONS.map(o => o.value)}
          selected={form.situacao}
          onChange={v => dispatch({ type: 'SET_SITUACAO', value: v })}
          labelMap={toLabelMap(SITUACAO_OPTIONS)}
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
          <p className="text-[11px] text-telemetry-text-muted mt-1.5 leading-relaxed">
            {form.tipo ? TIPO_DESCRIPTIONS[form.tipo] : 'Selecione como o ponto terminou'}
          </p>
        </Section>
      )}

      {hitterCandidates && hitterCandidates.length > 0 && form.tipo && (
        <Section num="" label={form.tipo === 'winner' ? 'Quem fez o Winner?' : 'Quem errou?'}>
          <Pills
            options={hitterCandidates.map(c => c.id)}
            selected={form.hitterId}
            onChange={v => dispatch({ type: 'SET_HITTER', value: form.hitterId === v ? null : v })}
            labelMap={Object.fromEntries(hitterCandidates.map(c => [c.id, c.name]))}
          />
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

      <PointDetailsCascadeSections form={form} dispatch={dispatch} refs={refs} computed={computed} />
    </div>
  );
}
