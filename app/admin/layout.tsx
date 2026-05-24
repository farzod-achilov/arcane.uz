'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { LanguageProvider } from '@/lib/i18n';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <LanguageProvider>
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#030309' }}
    >
      {/* Grid texture */}
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

      {/* Sidebar */}
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 relative" style={{ zIndex: 1 }}>
        <AdminTopbar />

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}
        >
          {children}
        </main>
      </div>
    </div>
    </LanguageProvider>
  );
}
