import type { ReportData } from '@/app/match/[id]/report/report.types';
import type { AdvancedStatsSectionProps } from './advanced-stats-primitives';

// ---------------------------------------------------------------------------
// Props comuns para os componentes premium
// ---------------------------------------------------------------------------
export interface PremiumVisualProps extends AdvancedStatsSectionProps {
  report?: ReportData;
}

// ---------------------------------------------------------------------------
// Helpers de cor para SVGs (compatível com tema dark broadcast e light)
// ---------------------------------------------------------------------------
export function tailwindClassToHex(cls: string, fallback: string = '#CCFF00'): string {
  if (cls.includes('telemetry-volt')) return '#CCFF00';
  if (cls.includes('emerald-800')) return '#065F46';
  return fallback;
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
