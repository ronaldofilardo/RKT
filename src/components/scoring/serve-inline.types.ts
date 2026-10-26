export type ServeAction = 'ace' | 'out' | 'net';
export type ServeStepName = 'first' | 'second';

/** Contrato entre o hook de estado e os componentes inline de saque. */
export interface ServeInlineControlsProps {
  step: ServeStepName;
  disabled: boolean;
  processing: boolean;
  openAction: ServeAction | null;
  onAction: (action: ServeAction) => void;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}
