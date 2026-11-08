'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ONBOARDING_CONTENT } from './onboarding-content';
import { OnboardingCard } from './onboarding-card';
import { OnboardingStepper } from './onboarding-stepper';
import { useOnboarding } from './use-onboarding';

function OnboardingContent() {
  const { loading, profile, step, totalSteps, destination, nextStep, previousStep, finish } = useOnboarding();

  if (loading) {
    return (
      <main className="min-h-screen bg-telemetry-base flex items-center justify-center p-4">
        <p className="text-sm font-medium text-telemetry-text-muted animate-pulse">Carregando introdução...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-telemetry-base flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <BrandLogo size="md" priority />
          <p className="text-sm text-telemetry-text-muted">Não foi possível carregar sua introdução.</p>
          <Link href={destination as any} className="inline-block bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-2.5 px-5 rounded-lg text-sm">
            Ir para o painel
          </Link>
        </div>
      </main>
    );
  }

  const content = ONBOARDING_CONTENT[profile];
  const isLast = step === totalSteps - 1;

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-5">
        <div className="flex justify-center"><BrandLogo size="md" priority /></div>

        <OnboardingStepper current={step} total={totalSteps} />
        <OnboardingCard content={content} step={content.steps[step]} index={step} total={totalSteps} />

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 0}
            className="px-4 py-2.5 text-sm font-semibold text-telemetry-text-muted hover:text-telemetry-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={finish}
              className="px-4 py-2.5 text-sm font-medium text-telemetry-text-muted hover:text-telemetry-text-primary"
            >
              Pular Introdução
            </button>
            <button
              type="button"
              onClick={isLast ? finish : nextStep}
              className="bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-2.5 px-6 rounded-lg text-sm"
            >
              {isLast ? 'Concluir' : 'Avançar'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-telemetry-base flex items-center justify-center p-4">
          <p className="text-sm font-medium text-telemetry-text-muted animate-pulse">Carregando introdução...</p>
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
