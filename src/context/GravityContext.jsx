import { useEffect, useRef, createContext, useContext } from 'react';

const GravityCtx = createContext(null);
export const useGravity = () => useContext(GravityCtx);

/**
 * GravityProvider -- injects live CSS custom properties on :root:
 *   --jb-tilt-x / --jb-tilt-y   (device orientation or mouse, -1..1)
 *   --jb-pointer-x / --jb-pointer-y  (pointer position, 0%..100%)
 *   --jb-scroll-progress  (0..1)
 *   --jb-flow-hue  (220 blue -> 280 violet, follows scroll)
 *   data-idle="true" on body after 3 s of no interaction
 *
 * All updates go through requestAnimationFrame -- zero React re-renders.
 */
export function GravityProvider({ children }) {
  const tilt = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const pointer = useRef({ x: 50, y: 50 });
  const idle = useRef(null);
  const isDevice = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const LERP = 0.08;
    const IDLE_MS = 3000;
    let raf = null;
    let running = true;

    /* ---------- helpers ---------- */
    const setVar = (k, v) => root.style.setProperty(k, v);

    const resetIdle = () => {
      body.removeAttribute('data-idle');
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => body.setAttribute('data-idle', 'true'), IDLE_MS);
    };

    /* ---------- device orientation ---------- */
    const onOrientation = (e) => {
      const gamma = e.gamma || 0;
      const beta = e.beta || 0;
      tilt.current.targetX = Math.max(-1, Math.min(1, gamma / 45));
      tilt.current.targetY = Math.max(-1, Math.min(1, (beta - 45) / 45));
      isDevice.current = true;
      resetIdle();
    };

    /* ---------- pointer ---------- */
    const onPointer = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 100;
      pointer.current.y = (e.clientY / window.innerHeight) * 100;
      if (!isDevice.current) {
        tilt.current.targetX = ((e.clientX / window.innerWidth) - 0.5) * 2;
        tilt.current.targetY = ((e.clientY / window.innerHeight) - 0.5) * 2;
      }
      resetIdle();
    };

    /* ---------- scroll ---------- */
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      setVar('--jb-scroll-progress', progress.toFixed(3));
      // Hue shifts from 220 (blue) to 280 (violet) as you scroll
      setVar('--jb-flow-hue', String(Math.round(220 + progress * 60)));
      resetIdle();
    };

    /* ---------- animation loop ---------- */
    const tick = () => {
      if (!running) return;
      const t = tilt.current;
      t.x += (t.targetX - t.x) * LERP;
      t.y += (t.targetY - t.y) * LERP;

      setVar('--jb-tilt-x', t.x.toFixed(4));
      setVar('--jb-tilt-y', t.y.toFixed(4));
      setVar('--jb-pointer-x', `${pointer.current.x.toFixed(1)}%`);
      setVar('--jb-pointer-y', `${pointer.current.y.toFixed(1)}%`);
      setVar('--jb-flow-x', `${pointer.current.x.toFixed(1)}%`);
      setVar('--jb-flow-y', `${pointer.current.y.toFixed(1)}%`);

      raf = requestAnimationFrame(tick);
    };

    /* ---------- setup ---------- */
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((p) => { if (p === 'granted') window.addEventListener('deviceorientation', onOrientation, { passive: true }); })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', onOrientation, { passive: true });
      }
    }

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial
    resetIdle();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (idle.current) clearTimeout(idle.current);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', resetIdle);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <GravityCtx.Provider value={null}>{children}</GravityCtx.Provider>;
}
