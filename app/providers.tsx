'use client';

import { UserProvider } from '@/lib/userContext';
import { OverlayProvider } from '@/lib/overlayContext';
import { CoinProvider } from '@/lib/coinContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CoinProvider>
      <OverlayProvider>
        <UserProvider>{children}</UserProvider>
      </OverlayProvider>
    </CoinProvider>
  );
}
