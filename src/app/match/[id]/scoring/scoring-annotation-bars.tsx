'use client';

import { PointAnnotationBars } from '@/components/scoring/PointAnnotationBars';
import type { ServeInlineControlsProps } from '@/components/scoring/serve-inline.types';
import type { HowPointEnded } from '@/components/scoring/usePointAnnotationFlow';
import type { ScoringAnnotationFlow } from './use-scoring-annotation-flow';

interface ScoringAnnotationBarsBlockProps {
  annotation: ScoringAnnotationFlow;
  serveControls?: ServeInlineControlsProps;
}

export function ScoringAnnotationBarsBlock({
  annotation,
  serveControls,
}: ScoringAnnotationBarsBlockProps) {
  if (!annotation.isActive || annotation.isDetails) return null;

  const handleSelectFault = (type: 'out' | 'net') => {
    serveControls?.onAction(type);
  };

  const handleConfirmServe = (effect?: string, direction?: string) => {
    serveControls?.onConfirm(effect, direction);
  };

  const handleCancelServe = () => {
    serveControls?.onCancel();
    annotation.cancelServe();
  };

  const handleSelectHowEnded = (option: HowPointEnded) => {
    if (serveControls?.openAction) serveControls.onCancel();
    annotation.selectHowEnded(option);
  };

  return (
    <PointAnnotationBars
      isSelectWinner={annotation.isSelectWinner}
      howEnded={annotation.flow.howEnded}
      whereWinner={annotation.flow.whereWinner}
      hasFirstServeError={annotation.hasFirstServeError}
      disabled={annotation.disabled}
      openServeAction={serveControls?.openAction}
      onSelectHowEnded={handleSelectHowEnded}
      onSelectFault={handleSelectFault}
      onConfirmServe={handleConfirmServe}
      onCancelServe={handleCancelServe}
      onSelectWhereWinner={annotation.selectWhereWinner}
      onBack={annotation.backToHowEnded}
      onCancel={() => {
        serveControls?.onCancel();
        annotation.cancelAnnotation();
      }}
    />
  );
}
