import { useState, useCallback, useRef } from 'react';

/**
 * Press feedback: scale down on press with spring release.
 * Optional magnetic mode: element follows finger slightly.
 */
export default function usePressResponse({ scale = 0.97, magnetic = false } = {}) {
  const [pressed, setPressed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const originRef = useRef(null);

  const onPointerDown = useCallback((e) => {
    setPressed(true);
    if (magnetic) {
      const rect = e.currentTarget.getBoundingClientRect();
      originRef.current = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    }
  }, [magnetic]);

  const onPointerMove = useCallback((e) => {
    if (!pressed || !magnetic || !originRef.current) return;
    const dx = (e.clientX - originRef.current.cx) * 0.15;
    const dy = (e.clientY - originRef.current.cy) * 0.15;
    setOffset({ x: Math.max(-8, Math.min(8, dx)), y: Math.max(-8, Math.min(8, dy)) });
  }, [pressed, magnetic]);

  const onPointerUp = useCallback(() => {
    setPressed(false);
    setOffset({ x: 0, y: 0 });
    originRef.current = null;
  }, []);

  const style = {
    transform: pressed
      ? `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`
      : 'scale(1) translate(0, 0)',
    transition: pressed
      ? 'transform 80ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    willChange: 'transform',
  };

  const bind = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
  };

  return { style, bind, pressed };
}
