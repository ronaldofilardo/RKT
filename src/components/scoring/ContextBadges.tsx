'use client';

interface ContextBadgesProps {
  isMatchPoint: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isTiebreak: boolean;
  isSuperTiebreak: boolean;
  pointsHistory?: string[];
  elapsedSeconds: number;
}

export function ContextBadges({ isMatchPoint, isSetPoint, isBreakPoint, isTiebreak, isSuperTiebreak, pointsHistory = [], elapsedSeconds }: ContextBadgesProps) {
  const badges: { icon: string; text: string; color: string }[] = [];

  if (isSuperTiebreak) {
    badges.push({ icon: '🎾', text: 'Super Tie-Break!', color: 'bg-red-100 text-red-700 border-red-200' });
  } else if (isTiebreak) {
    badges.push({ icon: '🎾', text: 'Tie-Break!', color: 'bg-amber-100 text-amber-700 border-amber-200' });
  }

  if (isMatchPoint) {
    badges.push({ icon: '🏆', text: 'Match Point!', color: 'bg-red-100 text-red-700 border-red-200' });
  } else if (isSetPoint) {
    badges.push({ icon: '🎯', text: 'Set Point!', color: 'bg-amber-100 text-amber-700 border-amber-200' });
  } else if (isBreakPoint) {
    badges.push({ icon: '⚡', text: 'Break Point!', color: 'bg-blue-100 text-blue-700 border-blue-200' });
  }

  if (pointsHistory.length >= 3) {
    const last3 = pointsHistory.slice(-3);
    if (last3.every(p => p === last3[0]) && last3[0]) {
      badges.push({ icon: '📊', text: `3 pontos seguidos`, color: 'bg-gray-100 text-gray-700 border-gray-200' });
    }
  }

  if (elapsedSeconds >= 60) {
    const mins = Math.floor(elapsedSeconds / 60);
    const hours = Math.floor(mins / 60);
    const display = hours > 0 ? `${hours}h ${mins % 60}min` : `${mins}min`;
    badges.push({ icon: '⏱', text: display, color: 'bg-gray-100 text-gray-500 border-gray-200' });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center my-2" aria-live="polite">
      {badges.map((b, i) => (
        <span key={i} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${b.color}`}>
          {b.icon} {b.text}
        </span>
      ))}
    </div>
  );
}
