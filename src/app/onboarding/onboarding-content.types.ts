export interface OnboardingStepContent {
  title: string;
  description: string;
  highlights: string[];
}

export interface OnboardingProfileContent {
  label: string;
  icon: string;
  steps: [OnboardingStepContent, OnboardingStepContent, OnboardingStepContent];
}
