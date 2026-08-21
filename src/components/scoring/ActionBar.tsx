'use client';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canRedo: boolean;
  canEdit: boolean;
  fontScale: number;
  isFinished: boolean;
  isProcessing?: boolean;
  onAce: () => void;
  onOut: (step: 'first' | 'second') => void;
  onNet: (step: 'first' | 'second') => void;
  onCancelSecondServe: () => void;
  onServeCancel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFontSmaller: () => void;
  onFontBigger: () => void;
  onEditScore: () => void;
  onStats?: () => void;
}

import { ActionBarView } from './ActionBar.view';

export function ActionBar({
  secondServe, serveStep, canUndo, canRedo, canEdit, fontScale, isFinished, isProcessing,
  onAce, onOut, onNet, onCancelSecondServe: _onCancelSecondServe, onServeCancel,
  onUndo, onRedo, onFontSmaller, onFontBigger, onEditScore, onStats,
}: ActionBarProps) {
  return <ActionBarView secondServe={secondServe} serveStep={serveStep} canUndo={canUndo} canRedo={canRedo} canEdit={canEdit} fontScale={fontScale} isFinished={isFinished} isProcessing={isProcessing} onAce={onAce} onOut={onOut} onNet={onNet} onServeCancel={onServeCancel} onUndo={onUndo} onRedo={onRedo} onFontSmaller={onFontSmaller} onFontBigger={onFontBigger} onEditScore={onEditScore} onStats={onStats} />;
}
