'use client';

import { useRef, ReactNode } from 'react';

interface SwipeHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export default function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
}: SwipeHandlerProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;

    // Ignore mostly-vertical swipes (scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      startX.current = null;
      startY.current = null;
      return;
    }

    if (deltaX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (deltaX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    startX.current = null;
    startY.current = null;
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
