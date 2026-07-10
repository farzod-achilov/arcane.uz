'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSidebar  from '@/components/admin/AdminSidebar';
import AdminTopbar   from '@/components/admin/AdminTopbar';
import { LanguageProvider } from '@/lib/i18n';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // переход по разделам закрывает мобильный drawer
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <LanguageProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#030309' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.018,
            zIndex: 0,
          }}
        />

        {/* Desktop: статичный сайдбар */}
        <div className="hidden md:flex h-full flex-shrink-0" style={{ zIndex: 2 }}>
          <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        </div>

        {/* Mobile: off-canvas drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0"
                style={{ width: 224 }}
              >
                <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 min-w-0 relative" style={{ zIndex: 1 }}>
          <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
          <main
            className="flex-1 overflow-y-auto overflow-x-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}
          >
            {children}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
