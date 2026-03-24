import { useState, useEffect, useRef } from 'react';
import useDeviceOrientation from './useDeviceOrientation';

/**
 * Converts device tilt into a parallax transform style.
 * depth 0 = static, depth 5 = maximum movement.
 */
export default function useGravityShift(depth = 2) {
  const { subscribe } = useDeviceOrientation();
  const [style, setStyle] = useState({});
  const frameRef = useRef(null);

  useEffect(() => {
    const MAX_OFFSET = 12; // px per depth unit
    const MAX_ROTATE = 2;  // degrees per depth unit
    const factor = depth / 5;

    const unsub = subscribe(({ tiltX, tiltY }) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setStyle({
          transform: [
            `translate3d(${tiltX * factor * MAX_OFFSET}px, ${tiltY * factor * MAX_OFFSET}px, 0)`,
            `rotateX(${-tiltY * factor * MAX_ROTATE}deg)`,
            `rotateY(${tiltX * factor * MAX_ROTATE}deg)`,
          ].join(' '),
          transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        });
      });
    });

    return () => {
      unsub();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [depth, subscribe]);

  return style;
}
