'use client';

import { ActionBarView } from './ActionBar.view';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canEdit: boolean;
  fontScale: number;
  isFinished: boolean;
  isProcessing?: boolean;
  aceDetailsEnabled: boolean;
  dfDetailsEnabled: boolean;
  onAceDetailsToggle: () => void;
  onDfDetailsToggle: () => void;
  onVoltar: (serveStep: 'none' | 'second') => void;
  onFontSmaller: () => void;
  onFontBigger: () => void;
  onEditScore: () => void;
  onComment?: () => void;
  onStats?: () => void;
}

/**
 * Barra do rodapé. Ace/Out/Net saíram daqui (agora em ServeInlineControls, sob o
 * card do sacador); o estado dos checkboxes de detalhe vive em useServeInlineControls.
 */
export function ActionBar(props: ActionBarProps) {
  return <ActionBarView {...props} />;
}
