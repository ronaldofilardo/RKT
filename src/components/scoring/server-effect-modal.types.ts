export type ServerEffectContext = 'winner' | 'error';
export type ServeStep = 'first' | 'second';
export type ServerErrorType = 'out' | 'net';

export interface ServerEffectModalProps {
  context: ServerEffectContext;
  serveStep: ServeStep;
  errorType?: ServerErrorType;
  winnerName: string;
  fontScale: number;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}
