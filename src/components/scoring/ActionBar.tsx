'use client';

import { useState } from 'react';
import { ActionBarView } from './ActionBar.view';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canRedo: boolean;
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
  onCancelSecondServe?: () => void;
  onServeCancel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFontSmaller: () => void;
  onFontBigger: () => void;
  onEditScore: () => void;
  onStats?: () => void;
}

export function ActionBar({
  secondServe,
  serveStep,
  canUndo,
  canRedo,
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
  onServeCancel,
  onUndo,
  onRedo,
  onFontSmaller,
  onFontBigger,
  onEditScore,
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
      canRedo={canRedo}
      canEdit={canEdit}
      fontScale={fontScale}
      isFinished={isFinished}
      isProcessing={isProcessing}
      onAce={handleAce}
      onOut={handleOut}
      onNet={handleNet}
      onServeCancel={onServeCancel}
      onUndo={onUndo}
      onRedo={onRedo}
      onFontSmaller={onFontSmaller}
      onFontBigger={onFontBigger}
      onEditScore={onEditScore}
      onStats={onStats}
    />
  );
}
