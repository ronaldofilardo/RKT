'use client';

import { useState } from 'react';
import { ActionBarView } from './ActionBar.view';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canEdit: boolean;
  fontScale: number;
  isFinished: boolean;
  isProcessing?: boolean;
  onAceDirect: () => void;
  onAceWithDetails: () => void;
  onOut: (step: 'first' | 'second') => void;
  onNet: (step: 'first' | 'second') => void;
  onOutDirect: (step: 'first' | 'second') => void;
  onNetDirect: (step: 'first' | 'second') => void;
  onVoltar: (serveStep: 'none' | 'second') => void;
  onFontSmaller: () => void;
  onFontBigger: () => void;
  onEditScore: () => void;
  onComment?: () => void;
  onStats?: () => void;
}

export function ActionBar({
  secondServe,
  serveStep,
  canUndo,
  canEdit,
  fontScale,
  isFinished,
  isProcessing,
  onAceDirect,
  onAceWithDetails,
  onOut,
  onNet,
  onOutDirect,
  onNetDirect,
  onVoltar,
  onFontSmaller,
  onFontBigger,
  onEditScore,
  onComment,
  onStats,
}: ActionBarProps) {
  const [aceDetailsEnabled, setAceDetailsEnabled] = useState(false);
  const [dfDetailsEnabled, setDfDetailsEnabled] = useState(false);
  const handleAce = () => {
    if (aceDetailsEnabled) {
      onAceWithDetails();
      return;
    }
    onAceDirect();
  };
  const handleOut = (step: 'first' | 'second') => {
    if (dfDetailsEnabled) {
      onOut(step);
      return;
    }
    onOutDirect(step);
  };
  const handleNet = (step: 'first' | 'second') => {
    if (dfDetailsEnabled) {
      onNet(step);
      return;
    }
    onNetDirect(step);
  };
  return (
    <ActionBarView
      aceDetailsEnabled={aceDetailsEnabled}
      onAceDetailsToggle={() => setAceDetailsEnabled((enabled) => !enabled)}
      dfDetailsEnabled={dfDetailsEnabled}
      onDfDetailsToggle={() => setDfDetailsEnabled((enabled) => !enabled)}
      secondServe={secondServe}
      serveStep={serveStep}
      canUndo={canUndo}
      canEdit={canEdit}
      fontScale={fontScale}
      isFinished={isFinished}
      isProcessing={isProcessing}
      onAce={handleAce}
      onOut={handleOut}
      onNet={handleNet}
      onVoltar={onVoltar}
      onFontSmaller={onFontSmaller}
      onFontBigger={onFontBigger}
      onEditScore={onEditScore}
      onComment={onComment}
      onStats={onStats}
    />
  );
}
