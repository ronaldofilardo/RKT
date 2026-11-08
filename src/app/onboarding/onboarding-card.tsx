import type { OnboardingProfileContent, OnboardingStepContent } from './onboarding-content';

interface OnboardingCardProps {
  content: OnboardingProfileContent;
  step: OnboardingStepContent;
  index: number;
  total: number;
}

export function OnboardingCard({ content, step, index, total }: OnboardingCardProps) {
  return (
    <section className="bg-telemetry-card border border-telemetry-border/15 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl" aria-hidden="true">{content.icon}</span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-telemetry-text-muted">
            Etapa {index + 1} de {total}
          </p>
          <p className="text-sm font-semibold text-telemetry-blue">{content.label}</p>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-telemetry-text-primary">{step.title}</h1>
      <p className="mt-2 text-sm text-telemetry-text-muted leading-relaxed">{step.description}</p>

      <ul className="mt-4 space-y-2">
        {step.highlights.map((highlight) => (
          <li key={highlight} className="flex gap-2 text-sm text-telemetry-text-primary">
            <span className="text-telemetry-volt font-bold" aria-hidden="true">✓</span>
            <span>{highlight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
