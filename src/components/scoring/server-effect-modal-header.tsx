import type { ServerEffectContext, ServeStep, ServerErrorType } from './server-effect-modal.types';

interface ServerEffectModalHeaderProps {
  context: ServerEffectContext;
  serveStep: ServeStep;
  errorType?: ServerErrorType;
  winnerName: string;
  isDoubleFault: boolean;
}

export function ServerEffectModalHeader({
  context,
  serveStep,
  errorType,
  winnerName,
  isDoubleFault,
}: ServerEffectModalHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-white/10 bg-white/">
      <h2 className="text-center font-bold text-telemetry-text-primary" style={{ fontSize: '1.15rem' }}>
        {context === 'winner' ? '🎾 Efeito do Saque' : `⚠️ Erro de Saque (${errorType === 'out' ? 'Out' : 'Net'})`}
      </h2>
      <p className="text-center text-sm mt-1">
        <span className="font-bold text-telemetry-volt">
          {serveStep === 'first' ? '1º Saque' : '2º Saque'}
        </span>
      </p>
      {isDoubleFault || context === 'winner' ? (
        <p className="text-center text-sm text-telemetry-text-muted mt-0.5">
          Ponto para:{' '}
          <span className={context === 'winner' ? 'text-telemetry-blue font-semibold' : 'text-telemetry-alert font-semibold'}>
            {winnerName}
          </span>
        </p>
      ) : null}
    </div>
  );
}
