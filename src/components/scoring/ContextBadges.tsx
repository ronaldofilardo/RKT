'use client';

interface ContextBadgesProps {
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isTiebreak: boolean;
  isSuperTiebreak: boolean;
  pointsHistory?: string[];
}

export function ContextBadges({ isMatchPoint, isSetPoint, isBreakPoint, isTiebreak, isSuperTiebreak, pointsHistory = [] }: ContextBadgesProps) {
  const badges: { icon: string; text: string; color: string }[] = [];

  if (isSuperTiebreak) {
    badges.push({ icon: '🎾', text: 'Super Tie-Break!', color: 'bg-red-100 text-red-700 border-red-200' });
  } else if (isTiebreak) {
    badges.push({ icon: '🎾', text: 'Tie-Break!', color: 'bg-amber-100 text-amber-700 border-amber-200' });
  }

  if (isSetPoint) {
    badges.push({ icon: '🎯', text: 'Set Point!', color: 'bg-amber-100 text-amber-700 border-amber-200' });
  } else if (isBreakPoint) {
    badges.push({ icon: '⚡', text: 'Break Point!', color: 'bg-blue-100 text-blue-700 border-blue-200' });
  }

  if (pointsHistory.length >= 3) {
    const last3 = pointsHistory.slice(-3);
    if (last3.every(p => p === last3[0]) && last3[0]) {
      badges.push({ icon: '📊', text: `3 pontos seguidos`, color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' });
    }
  }

  if (badges.length === 0) return null;

  const hasSetPoint = badges.some(b => b.text === 'Set Point!');

  return (
    <div className={`flex flex-wrap gap-1 sm:gap-2 justify-center ${hasSetPoint ? 'my-1 sm:my-2' : 'my-1 sm:my-2'}`} aria-live="polite">
      {badges.map((b, i) => (
        <span key={i} className={`inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${b.color}`}>
          <span className="text-[10px] sm:text-xs">{b.icon}</span> {b.text}
        </span>
      ))}
    </div>
  );
}
