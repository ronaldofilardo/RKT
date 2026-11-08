const STEP_LABELS = ['Boas-vindas', 'Recursos', 'Próximo passo'];

export function OnboardingStepper({ current, total }: { current: number; total: number }) {
  return (
    <ol className="flex items-start gap-2" aria-label="Progresso da introdução">
      {STEP_LABELS.slice(0, total).map((label, index) => {
        const isCurrent = index === current;
        const isDone = index < current;
        return (
          <li
            key={label}
            className="flex-1"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div
              className={`h-1.5 rounded-full transition-colors ${
                isDone || isCurrent ? 'bg-telemetry-blue' : 'bg-telemetry-border/20'
              }`}
            />
            <span
              className={`mt-1.5 block text-[11px] font-medium ${
                isCurrent ? 'text-telemetry-text-primary' : 'text-telemetry-text-muted'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
