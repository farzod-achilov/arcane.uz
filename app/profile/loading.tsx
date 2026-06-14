function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: '#12121A', ...style }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }} />
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero card */}
        <div className="rounded-2xl p-6 mb-6 flex items-center gap-5"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Shimmer style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
          <div className="flex-1 space-y-2.5">
            <Shimmer style={{ height: 22, width: '40%', borderRadius: 8 }} />
            <Shimmer style={{ height: 14, width: '25%', borderRadius: 6 }} />
            <Shimmer style={{ height: 8, width: '60%', borderRadius: 4, marginTop: 8 }} />
          </div>
          <div className="hidden sm:flex gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="text-center space-y-1.5">
                <Shimmer style={{ height: 24, width: 60, borderRadius: 8 }} />
                <Shimmer style={{ height: 11, width: 50, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[1,2,3,4,5].map(i => (
            <Shimmer key={i} style={{ height: 36, width: 100, borderRadius: 10, flexShrink: 0 }} />
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Shimmer style={{ height: 120, borderRadius: 16 }} />
            <Shimmer style={{ height: 180, borderRadius: 16 }} />
            <Shimmer style={{ height: 100, borderRadius: 16 }} />
          </div>
          <div className="space-y-4">
            <Shimmer style={{ height: 140, borderRadius: 16 }} />
            <Shimmer style={{ height: 120, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
