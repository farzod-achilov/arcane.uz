'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible,  setVisible]  = useState(false);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef  = useRef(0);

  // When route finishes — complete the bar
  useEffect(() => {
    complete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Intercept internal-link clicks to start the bar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Only internal, non-hash, non-file links
      if (href.startsWith('/') && !href.startsWith('//') && !href.includes('#')) {
        // Don't start if same page
        const samePage = href.split('?')[0] === pathname;
        if (!samePage) start();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function start() {
    stopTimer();
    targetRef.current = 0;
    setProgress(0);
    setVisible(true);

    // Simulate incremental progress: fast to 30%, then slower
    timerRef.current = setInterval(() => {
      targetRef.current = Math.min(targetRef.current + Math.random() * 8, 85);
      setProgress(targetRef.current);
    }, 120);
  }

  function complete() {
    stopTimer();
    if (!visible && progress === 0) return;
    setProgress(100);
    // Hide after transition
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 320);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 9999, height: '2px' }}
    >
      <div
        style={{
          height: '100%',
          width:  `${progress}%`,
          background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
          transition: progress === 100
            ? 'width 0.15s ease-out, opacity 0.2s ease'
            : 'width 0.1s linear',
          opacity: progress === 100 ? 0 : 1,
          boxShadow: '0 0 8px rgba(124,58,237,0.8)',
        }}
      />
    </div>
  );
}
