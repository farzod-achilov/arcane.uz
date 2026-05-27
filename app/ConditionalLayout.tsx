'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useOverlay } from '@/lib/overlayContext';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const { isFullscreenOverlay } = useOverlay();

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {!isFullscreenOverlay && <Navbar />}
      <main className={`page-enter ${isFullscreenOverlay ? '' : 'pt-[120px] pb-[60px] md:pb-0'}`}>
        {children}
      </main>
      {!isFullscreenOverlay && <Footer />}
    </>
  );
}
