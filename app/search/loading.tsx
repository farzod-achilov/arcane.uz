export default function SearchLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #0D0A1A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-3 w-16 rounded mb-3 animate-pulse" style={{ background: '#1A1A28' }} />
          <div className="h-9 w-64 rounded-xl animate-pulse" style={{ background: '#1A1A28' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden animate-pulse"
              style={{ background: '#12121A', animationDelay: `${i * 40}ms` }}
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
  );
}
