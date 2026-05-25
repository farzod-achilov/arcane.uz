'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { UserProvider } from '@/lib/userContext';
import { OverlayProvider } from '@/lib/overlayContext';
import { CoinProvider } from '@/lib/coinContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CoinProvider>
        <OverlayProvider>
          <UserProvider>{children}</UserProvider>
        </OverlayProvider>
      </CoinProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:   '#12121A',
            border:       '1px solid rgba(124,58,237,0.25)',
            color:        '#E2E8F0',
            borderRadius: '12px',
            fontFamily:   'var(--font-inter)',
            fontSize:     '13.5px',
          },
        }}
        richColors
      />
    </SessionProvider>
  );
}
