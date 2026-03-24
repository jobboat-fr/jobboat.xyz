import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps child content and applies CSS page-transition classes on route change.
 * No external lib -- pure CSS animations driven by class toggling.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionClass, setTransitionClass] = useState('page-transition-enter');
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      // New route -- play exit then enter
      setTransitionClass('page-transition-exit');

      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionClass('page-transition-enter');
        prevKey.current = location.key;
      }, 150); // matches --jb-duration-fast

      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [location.key, children]);

  return (
    <div className={transitionClass} style={{ willChange: 'transform, opacity' }}>
      {displayChildren}
    </div>
  );
}
