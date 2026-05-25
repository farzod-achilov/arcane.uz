export default function CatalogLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      {/* Header skeleton */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0D0A1A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-3 w-20 rounded mb-3 animate-pulse" style={{ background: '#1A1A28' }} />
          <div className="h-9 w-52 rounded-xl animate-pulse" style={{ background: '#1A1A28' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Toolbar skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="h-10 flex-1 rounded-xl animate-pulse" style={{ background: '#12121A' }} />
          <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: '#12121A' }} />
          <div className="h-10 w-20 rounded-xl animate-pulse" style={{ background: '#12121A' }} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden lg:flex flex-col w-56 gap-2">
            <div className="h-3 w-24 rounded animate-pulse mb-1" style={{ background: '#1A1A28' }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 rounded-xl animate-pulse" style={{ background: '#12121A', animationDelay: `${i * 60}ms` }} />
            ))}
            <div className="h-3 w-16 rounded animate-pulse mt-4 mb-1" style={{ background: '#1A1A28' }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-xl animate-pulse" style={{ background: '#12121A', animationDelay: `${(i + 3) * 60}ms` }} />
            ))}
          </div>

          {/* Grid skeleton */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden animate-pulse"
                style={{ background: '#12121A', animationDelay: `${i * 35}ms` }}
              >
                <div style={{ aspectRatio: '3/4', background: '#1A1A28' }} />
                <div className="p-3 space-y-2">
                  <div className="h-4 rounded" style={{ background: '#1E1E2E' }} />
                  <div className="h-3 w-2/3 rounded" style={{ background: '#1E1E2E' }} />
                  <div className="h-4 w-1/2 rounded mt-3" style={{ background: '#1E1E2E' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
