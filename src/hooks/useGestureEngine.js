import { useRef, useCallback } from 'react';

/**
 * Detects swipe, pull-down, and long-press gestures.
 * Returns bind() handlers to attach to a container element.
 */
export default function useGestureEngine(onGesture) {
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const SWIPE_THRESHOLD = 80;
  const SWIPE_VELOCITY = 0.4;
  const PULL_THRESHOLD = 100;
  const LONG_PRESS_MS = 500;

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
    timerRef.current = setTimeout(() => {
      if (onGesture) {
        onGesture({ gesture: 'long-press', direction: null, velocity: 0, delta: { x: 0, y: 0 } });
      }
    }, LONG_PRESS_MS);
  }, [onGesture]);

  const onTouchMove = useCallback(() => {
    // Cancel long-press if finger moves
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!startRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const dt = (Date.now() - startRef.current.t) / 1000;
    const vx = Math.abs(dx) / dt;
    const vy = Math.abs(dy) / dt;

    let gesture = null;
    let direction = null;

    if (Math.abs(dx) > SWIPE_THRESHOLD && vx > SWIPE_VELOCITY && Math.abs(dx) > Math.abs(dy)) {
      gesture = 'swipe';
      direction = dx > 0 ? 'right' : 'left';
    } else if (dy > PULL_THRESHOLD && vy > SWIPE_VELOCITY && Math.abs(dy) > Math.abs(dx)) {
      gesture = 'pull-down';
      direction = 'down';
    } else if (Math.abs(dy) > SWIPE_THRESHOLD && vy > SWIPE_VELOCITY && Math.abs(dy) > Math.abs(dx)) {
      gesture = 'swipe';
      direction = dy > 0 ? 'down' : 'up';
    }

    if (gesture && onGesture) {
      onGesture({
        gesture,
        direction,
        velocity: gesture === 'swipe' ? vx : vy,
        delta: { x: dx, y: dy },
      });
    }
    startRef.current = null;
  }, [onGesture]);

  const bind = useCallback(() => ({
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }), [onTouchStart, onTouchMove, onTouchEnd]);

  return { bind };
}
