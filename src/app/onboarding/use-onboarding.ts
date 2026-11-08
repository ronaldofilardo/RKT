'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sanitizeNextRedirect } from '@/core/access/safe-redirect.logic';
import { homeForArea, type AreaCode } from '@/core/access/areas';
import { isAreaUrlsEnabled } from '@/lib/feature-flags';
import {
  isOnboarded,
  markOnboarded,
  onboardingProfileFor,
  onboardingProfileForArea,
  type OnboardingProfile,
} from '@/lib/onboarding';

export const ONBOARDING_TOTAL_STEPS = 3;

export function useOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('/dashboard');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(paramsKey);
    const rawNext = params.get('next');

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const area = (data?.activeArea ?? null) as AreaCode | null;
        const areas = (data?.availableAreas ?? []) as Array<{ code: string }>;
        const inferredArea = areas.find((item) => onboardingProfileForArea(item.code))?.code as AreaCode | undefined;
        const resolvedArea = area ?? inferredArea ?? null;
        const areaHome = isAreaUrlsEnabled() && resolvedArea ? homeForArea(resolvedArea) : '/dashboard';
        const next = sanitizeNextRedirect(rawNext, areaHome);
        setDestination(next);

        const resolved =
          onboardingProfileFor(area, params.get('perfil') ?? data?.user?.role) ??
          onboardingProfileForArea(inferredArea);
        setProfile(resolved);
        setUserId(data?.user?.id ?? null);

        if (!data?.user?.id || !resolved) {
          setLoading(false);
          return;
        }
        if (isOnboarded(data.user.id)) {
          router.replace(next as any);
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDestination(sanitizeNextRedirect(rawNext, '/dashboard'));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paramsKey, router]);

  const finish = useCallback(() => {
    if (userId) markOnboarded(userId);
    router.replace(destination as any);
  }, [destination, router, userId]);

  return {
    loading,
    profile,
    step,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    destination,
    nextStep: () => setStep((current) => Math.min(current + 1, ONBOARDING_TOTAL_STEPS - 1)),
    previousStep: () => setStep((current) => Math.max(current - 1, 0)),
    finish,
  };
}
