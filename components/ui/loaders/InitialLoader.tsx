'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ArcadeLoader from './ArcadeLoader';

const SESSION_KEY = 'arcane_booted';

/**
 * Shows the fullscreen ArcadeLoader once per browser session.
 * Drop into the root layout above <Navbar />.
 */
export default function InitialLoader() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Skip if already booted this session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }
    setShow(true);
  }, []);

  const handleComplete = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    setDone(true);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {!done && (
        <ArcadeLoader key="arcade-loader" onComplete={handleComplete} duration={3000} />
      )}
    </AnimatePresence>
  );
}
