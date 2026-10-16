'use client';

export function usePlayerCardTouch(onPoint: () => void, onSwipeDown: () => void) {
  const touchStartY = { current: 0 };
  const touchHandledRef = { current: false };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchHandledRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) {
      onSwipeDown();
      touchHandledRef.current = true;
    } else {
      onPoint();
      touchHandledRef.current = true;
    }
  };

  const handleClick = (_e: React.MouseEvent) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onPoint();
  };

  return { handleTouchStart, handleTouchEnd, handleClick };
}
