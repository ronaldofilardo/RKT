import type { ReactNode } from 'react';

interface RankingRowsProps {
  hasOnlyPosition: boolean;
  showCategory: boolean;
  showClasses: boolean;
  categoryRow: ReactNode;
  classRow: ReactNode;
  onlyPositionRow: ReactNode;
}

export function RankingFormRows({
  hasOnlyPosition,
  showCategory,
  showClasses,
  categoryRow,
  classRow,
  onlyPositionRow,
}: RankingRowsProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      {hasOnlyPosition && (
        <div className="grid grid-cols-[68px_minmax(0,1.2fr)] gap-2 sm:gap-2.5 items-end">{onlyPositionRow}</div>
      )}
      {showCategory && (
        <div className="grid grid-cols-[minmax(0,1.2fr)_68px_minmax(0,1.2fr)] gap-2 sm:gap-2.5 items-end">{categoryRow}</div>
      )}
      {showClasses && (
        <div className="grid grid-cols-[minmax(0,1.2fr)_68px_minmax(0,1.2fr)] gap-2 sm:gap-2.5 items-end">{classRow}</div>
      )}
    </div>
  );
}
