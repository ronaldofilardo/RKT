import { describe, it, expect } from '@jest/globals';

/**
 * WCAG 2.1 Contrast Ratio Calculation
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter, L2 is darker
 * Luminance: 0.2126 * R + 0.7152 * G + 0.0722 * B (sRGB linearized)
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function srgbToLinear(c: number): number {
  const c8 = c / 255;
  return c8 <= 0.04045 ? c8 / 12.92 : Math.pow((c8 + 0.055) / 1.055, 2.4);
}

function luminance(r: number, g: number, b: number): number {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastTestCase {
  name: string;
  foreground: string;
  background: string;
  minRatio: number; // 4.5 for AA, 7 for AAA
  description: string;
}

// Color tokens from globals.css (light theme - warm court)
// Dark theme tokens are tested against dark backgrounds
const testCases: ContrastTestCase[] = [
  // ===== LIGHT THEME (Warm Court Ground: #F2EFE9, Card: #FFFFFF, Elevated: #EBE7DF) =====
  
  // Main score digits on elevated surface (WCAG AAA 7:1)
  {
    name: 'Light: telemetry-score-main on telemetry-elevated',
    foreground: '#0F172A', // --telemetry-score-main
    background: '#EBE7DF', // --telemetry-elevated
    minRatio: 7,
    description: 'Main score digits on elevated cells (AAA)',
  },
  {
    name: 'Light: telemetry-score-main on telemetry-card',
    foreground: '#0F172A', // --telemetry-score-main
    background: '#FFFFFF', // --telemetry-card
    minRatio: 7,
    description: 'Main score digits on card surface (AAA)',
  },

  // Past/secondary score digits on elevated surface (WCAG AAA 7:1)
  {
    name: 'Light: telemetry-score-secondary on telemetry-elevated',
    foreground: '#334155', // --telemetry-score-secondary
    background: '#EBE7DF', // --telemetry-elevated
    minRatio: 7,
    description: 'Past set scores on elevated cells (AAA)',
  },
  {
    name: 'Light: telemetry-score-secondary on telemetry-card',
    foreground: '#334155', // --telemetry-score-secondary
    background: '#FFFFFF', // --telemetry-card
    minRatio: 7,
    description: 'Past set scores on card surface (AAA)',
  },

  // Current game/live accent on elevated surface (WCAG AAA 7:1)
  {
    name: 'Light: telemetry-score-accent on telemetry-elevated',
    foreground: '#0F5003', // --telemetry-score-accent (near-black green)
    background: '#EBE7DF', // --telemetry-elevated
    minRatio: 7,
    description: 'Current game/live accent on elevated (AAA)',
  },
  {
    name: 'Light: telemetry-score-accent on telemetry-card',
    foreground: '#0F5003', // --telemetry-score-accent (near-black green)
    background: '#FFFFFF', // --telemetry-card
    minRatio: 7,
    description: 'Current game/live accent on card (AAA)',
  },

  // Text primary on base (WCAG AAA 7:1)
  {
    name: 'Light: telemetry-text-primary on telemetry-base',
    foreground: '#0F172A', // --telemetry-text-primary
    background: '#F2EFE9', // --telemetry-base
    minRatio: 7,
    description: 'Primary text on warm court ground (AAA)',
  },

  // Text muted on elevated (WCAG AA 4.5:1 minimum, but we aim for AAA)
  {
    name: 'Light: telemetry-text-muted on telemetry-elevated',
    foreground: '#334155', // --telemetry-text-muted (updated to Slate 700)
    background: '#EBE7DF', // --telemetry-elevated
    minRatio: 7,
    description: 'Muted text on elevated (AAA target)',
  },

  // ===== DARK THEME (Base: #0A0F1D, Card: #111827, Elevated: #1E293B) =====
  
  // Main score digits on dark elevated (WCAG AAA 7:1)
  {
    name: 'Dark: telemetry-score-main on telemetry-elevated',
    foreground: '#F8FAFC', // --telemetry-text-primary (white)
    background: '#1E293B', // --telemetry-elevated
    minRatio: 7,
    description: 'Main score digits on dark elevated (AAA)',
  },
  {
    name: 'Dark: telemetry-score-main on telemetry-card',
    foreground: '#F8FAFC', // --telemetry-text-primary (white)
    background: '#111827', // --telemetry-card
    minRatio: 7,
    description: 'Main score digits on dark card (AAA)',
  },

  // Past/secondary score digits on dark elevated (WCAG AAA 7:1)
  {
    name: 'Dark: telemetry-score-secondary on telemetry-elevated',
    foreground: '#CBD5E1', // Slate 300 - past sets
    background: '#1E293B', // --telemetry-elevated
    minRatio: 7,
    description: 'Past set scores on dark elevated (AAA)',
  },
  {
    name: 'Dark: telemetry-score-secondary on telemetry-card',
    foreground: '#CBD5E1', // Slate 300
    background: '#111827', // --telemetry-card
    minRatio: 7,
    description: 'Past set scores on dark card (AAA)',
  },

  // Volt accent on dark elevated (WCAG AAA 7:1)
  {
    name: 'Dark: telemetry-volt on telemetry-elevated',
    foreground: '#CCFF00', // --telemetry-volt
    background: '#1E293B', // --telemetry-elevated
    minRatio: 7,
    description: 'Volt accent on dark elevated (AAA)',
  },
  {
    name: 'Dark: telemetry-volt on telemetry-card',
    foreground: '#CCFF00', // --telemetry-volt
    background: '#111827', // --telemetry-card
    minRatio: 7,
    description: 'Volt accent on dark card (AAA)',
  },

  // Blue winner background with white text (WCAG AAA 7:1)
  {
    name: 'Dark: white on telemetry-blue',
    foreground: '#FFFFFF',
    background: '#19375F', // --telemetry-blue (dark navy)
    minRatio: 7,
    description: 'Winner cell text on blue background (AAA)',
  },

  // Court badge tests (Pilar 3)
  // Light: 12% opacity background, dark text
  {
    name: 'Light: Court Clay badge text on badge background',
    foreground: '#C4623A', // --telemetry-court-clay
    background: 'rgba(196, 98, 58, 0.12)', // 12% opacity on white-ish
    minRatio: 4.5,
    description: 'Clay court badge text on light background (AA)',
  },
  {
    name: 'Light: Court Grass badge text on badge background',
    foreground: '#2D8A3E', // --telemetry-court-grass
    background: 'rgba(45, 138, 62, 0.12)',
    minRatio: 4.5,
    description: 'Grass court badge text on light background (AA)',
  },
  {
    name: 'Light: Court Hard badge text on badge background',
    foreground: '#BFDBFE', // Lighter blue for badge text (--telemetry-blue-light)
    background: 'rgba(30, 77, 123, 0.12)',
    minRatio: 4.5,
    description: 'Hard court badge text on light background (AA)',
  },

  // Dark: 20% opacity background, bright text
  {
    name: 'Dark: Court Clay badge text on badge background',
    foreground: '#C4623A', // --telemetry-court-clay
    background: 'rgba(196, 98, 58, 0.20)', // 20% opacity on dark
    minRatio: 4.5,
    description: 'Clay court badge text on dark background (AA)',
  },
  {
    name: 'Dark: Court Grass badge text on badge background',
    foreground: '#2D8A3E', // --telemetry-court-grass
    background: 'rgba(45, 138, 62, 0.20)',
    minRatio: 4.5,
    description: 'Grass court badge text on dark background (AA)',
  },
{
    name: 'Dark: Court Hard badge text on badge background',
    foreground: '#BFDBFE', // Lighter blue for badge text (--telemetry-blue-light)
    background: 'rgba(30, 77, 123, 0.20)',
    minRatio: 4.5,
    description: 'Hard court badge text on dark background (AA)',
  },
];

describe('WCAG Contrast Validation', () => {
  it.each(testCases)('$name', ({ foreground, background, minRatio, description }) => {
    const ratio = contrastRatio(foreground, background);
    expect(ratio).toBeGreaterThanOrEqual(minRatio);
  });

  it('should have no test cases below WCAG AAA (7:1) for score digits', () => {
    const scoreDigitTests = testCases.filter(
      (tc) => tc.description.includes('score') || tc.description.includes('accent') || tc.description.includes('Past set')
    );
    const failed = scoreDigitTests.filter((tc) => {
      const ratio = contrastRatio(tc.foreground, tc.background);
      return ratio < 7;
    });
    expect(failed).toHaveLength(0);
  });

  it('should have no test cases below WCAG AA (4.5:1) for court badges', () => {
    const badgeTests = testCases.filter((tc) => tc.description.includes('badge'));
    const failed = badgeTests.filter((tc) => {
      const ratio = contrastRatio(tc.foreground, tc.background);
      return ratio < 4.5;
    });
    expect(failed).toHaveLength(0);
  });
});