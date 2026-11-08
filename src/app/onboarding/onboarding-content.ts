import type { OnboardingProfile } from '@/lib/onboarding';
import { ATLETA_CONTENT, TREINADOR_CONTENT } from './onboarding-content.athlete-coach';
import { GESTOR_CONTENT, ESPECTADOR_CONTENT } from './onboarding-content.manager-spectator';
import type { OnboardingProfileContent } from './onboarding-content.types';

export type { OnboardingProfileContent, OnboardingStepContent } from './onboarding-content.types';

export const ONBOARDING_CONTENT: Record<OnboardingProfile, OnboardingProfileContent> = {
  ATLETA: ATLETA_CONTENT,
  TREINADOR: TREINADOR_CONTENT,
  GESTOR: GESTOR_CONTENT,
  ESPECTADOR: ESPECTADOR_CONTENT,
};
