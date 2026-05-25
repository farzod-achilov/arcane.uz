export default function GameLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <div className="h-4 w-36 rounded animate-pulse mb-8" style={{ background: '#12121A' }} />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left */}
          <div className="flex-shrink-0 lg:w-72">
            <div
              className="rounded-2xl animate-pulse mb-5 mx-auto lg:mx-0"
              style={{ width: '100%', maxWidth: '288px', aspectRatio: '3/4', background: '#12121A' }}
            />
            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-4 w-32 rounded animate-pulse" style={{ background: '#1A1A28' }} />
              <div className="h-8 w-44 rounded animate-pulse" style={{ background: '#1A1A28' }} />
              <div className="h-11 rounded-xl animate-pulse" style={{ background: '#1A1A28' }} />
              <div className="h-4 w-48 rounded animate-pulse" style={{ background: '#1A1A28' }} />
            </div>
          </div>

          {/* Right */}
          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              {[80, 64, 72].map((w, i) => (
                <div key={i} className="h-5 rounded animate-pulse" style={{ width: `${w}px`, background: '#12121A' }} />
              ))}
            </div>
            <div className="h-10 w-3/4 rounded-xl animate-pulse" style={{ background: '#12121A' }} />
            <div className="flex gap-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-24 rounded animate-pulse" style={{ background: '#12121A' }} />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[100, 96, 98, 90, 85, 92, 78].map((w, i) => (
                <div
                  key={i}
                  className="h-4 rounded animate-pulse"
                  style={{ width: `${w}%`, background: '#12121A', animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
            {/* Screenshots row skeleton */}
            <div className="flex gap-3 mt-8 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-xl animate-pulse"
                  style={{ width: '240px', aspectRatio: '16/9', background: '#12121A', animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
