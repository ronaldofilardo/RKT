'use client';

export function usePlayerCardTouch(onPoint: () => void, onSwipeDown: () => void) {
  const touchStartY = { current: 0 };
  const touchHandledRef = { current: false };

  const onTouchStartGesture = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchHandledRef.current = false;
  };

  const onTouchEndGesture = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) {
      onSwipeDown();
      touchHandledRef.current = true;
    } else {
      onPoint();
      touchHandledRef.current = true;
    }
  };

  const onPrimaryClick = (_e: React.MouseEvent) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onPoint();
  };

  return { onTouchStartGesture, onTouchEndGesture, onPrimaryClick };
}
