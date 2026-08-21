import type { PointDetailsForm, Vencedor } from './point-details-logic';
import { getSectionRenderState } from './SectionRenderer.state.helpers';
import {
  DirecaoSection,
  DuracaoSection,
  EfeitoSection,
  GolpeEspSection,
  GolpeSection,
  SituationSection,
  Subtipo1Section,
  Subtipo2Section,
  TipoSection,
} from './SectionRenderer.sections';

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

export function SectionRenderer({ form, vencedor, dispatch, refs }: SectionRendererProps) {
  const {
    needsSubtipo1,
    needsSubtipo2,
    needsEfeito,
    isDirecaoBlocked,
    direcaoOptions,
    golpeEspOptions,
  } = getSectionRenderState({ form, vencedor, dispatch, refs });

  return <div className="flex-1 overflow-y-auto px-5 py-4 space-y-[18px]" data-testid="modal-content">
    <SituationSection form={form} dispatch={dispatch} />
    <TipoSection form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} />
    <GolpeSection form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} />
    <Subtipo1Section form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} />
    <Subtipo2Section form={form} dispatch={dispatch} refs={refs} needsSubtipo1={needsSubtipo1} />
    <EfeitoSection form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} needsSubtipo1={needsSubtipo1} needsSubtipo2={needsSubtipo2} />
    <DirecaoSection form={form} dispatch={dispatch} direcaoOptions={direcaoOptions} isBlocked={isDirecaoBlocked} />
    <GolpeEspSection form={form} dispatch={dispatch} options={golpeEspOptions} />
    <DuracaoSection form={form} dispatch={dispatch} refs={refs} needsSubtipo1={needsSubtipo1} needsSubtipo2={needsSubtipo2} needsEfeito={needsEfeito} />
  </div>;
}
