'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface OverlayContextValue {
  isFullscreenOverlay: boolean;
  setFullscreenOverlay: (v: boolean) => void;
}

const OverlayContext = createContext<OverlayContextValue>({
  isFullscreenOverlay: false,
  setFullscreenOverlay: () => {},
});

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [isFullscreenOverlay, setFullscreenOverlay] = useState(false);
  return (
    <OverlayContext.Provider value={{ isFullscreenOverlay, setFullscreenOverlay }}>
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  return useContext(OverlayContext);
}
