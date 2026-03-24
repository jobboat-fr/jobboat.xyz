import { useEffect, useRef, useCallback } from 'react';

/**
 * Reads device gyroscope (mobile) or mouse position (desktop).
 * Returns normalised tilt values between -1 and +1 with lerp smoothing.
 */
export default function useDeviceOrientation() {
  const state = useRef({ tiltX: 0, tiltY: 0, isDevice: false });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(null);
  const listeners = useRef(new Set());

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  useEffect(() => {
    const LERP = 0.08;
    let running = true;

    /* --- Smoothing loop --- */
    const tick = () => {
      if (!running) return;
      const s = state.current;
      const t = target.current;
      s.tiltX += (t.x - s.tiltX) * LERP;
      s.tiltY += (t.y - s.tiltY) * LERP;
      listeners.current.forEach((fn) => fn(s));
      raf.current = requestAnimationFrame(tick);
    };

    /* --- Device orientation (mobile gyroscope) --- */
    const onOrientation = (e) => {
      const gamma = e.gamma || 0; // left-right tilt (-90..90)
      const beta = e.beta || 0;   // front-back tilt (-180..180)
      target.current.x = Math.max(-1, Math.min(1, gamma / 45));
      target.current.y = Math.max(-1, Math.min(1, (beta - 45) / 45));
      state.current.isDevice = true;
    };

    /* --- Mouse fallback (desktop) --- */
    const onMouse = (e) => {
      if (state.current.isDevice) return;
      target.current.x = ((e.clientX / window.innerWidth) - 0.5) * 2;
      target.current.y = ((e.clientY / window.innerHeight) - 0.5) * 2;
    };

    /* --- Try requesting device permission (iOS 13+) --- */
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((perm) => {
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', onOrientation, { passive: true });
          }
        })
        .catch(() => {});
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }

    window.addEventListener('mousemove', onMouse, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return { state, subscribe };
}
