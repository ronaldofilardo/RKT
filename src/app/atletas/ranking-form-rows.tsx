import type { ReactNode } from 'react';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from './ranking-form.types';
import { RankingNumberField } from './ranking-number-field';

interface RankingRowsProps {
  type: RankingType;
  state: RankingState;
  saving: boolean;
  showCategory: boolean;
  showClasses: boolean;
  showJuvenilePosition: boolean;
  hasOnlyPosition: boolean;
  firstRow: ReactNode;
  classField: ReactNode;
  rankingDateField: ReactNode;
  onJuvenilePositionChange: (value: string) => void;
}

export function RankingFormRows({
  type,
  state,
  saving,
  showCategory,
  showClasses,
  showJuvenilePosition,
  hasOnlyPosition,
  firstRow,
  classField,
  rankingDateField,
  onJuvenilePositionChange,
}: RankingRowsProps) {
  const showThirdRow = showCategory && showClasses && showJuvenilePosition;

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="grid grid-cols-2 gap-3">{firstRow}</div>
      {!hasOnlyPosition && (
        <div className="grid grid-cols-2 gap-3">
          {showCategory && showClasses ? (
            <>
              {classField}
              {rankingDateField}
            </>
          ) : showJuvenilePosition ? (
            <>
              <RankingNumberField
                id={`ranking-${type}-juvenile-position`}
                label="Posição Ranking Juvenil"
                value={state.juvenilePosition}
                disabled={saving}
                onChange={onJuvenilePositionChange}
              />
              {rankingDateField}
            </>
          ) : (
            <>
              {rankingDateField}
              <div />
            </>
          )}
        </div>
      )}
      {showThirdRow && (
        <div className="grid grid-cols-2 gap-3">
          <RankingNumberField
            id={`ranking-${type}-juvenile-position`}
            label="Posição Ranking Juvenil"
            value={state.juvenilePosition}
            disabled={saving}
            onChange={onJuvenilePositionChange}
          />
          <div />
        </div>
      )}
    </div>
  );
}
