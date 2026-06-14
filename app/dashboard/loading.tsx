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

export default function DashboardLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#04040A', paddingTop: '96px' }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl p-6 flex items-center gap-5"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Shimmer style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }} />
          <div className="flex-1 space-y-2.5">
            <Shimmer style={{ height: 20, width: '45%', borderRadius: 8 }} />
            <Shimmer style={{ height: 13, width: '30%', borderRadius: 6 }} />
            <Shimmer style={{ height: 7, width: '65%', borderRadius: 4, marginTop: 8 }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <Shimmer key={i} style={{ height: 90, borderRadius: 16 }} />
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Shimmer key={i} style={{ height: 72, borderRadius: 14 }} />
          ))}
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl p-5 space-y-3"
             style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Shimmer style={{ height: 16, width: 140, borderRadius: 6, marginBottom: 4 }} />
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
              <div className="flex-1 space-y-1.5">
                <Shimmer style={{ height: 13, width: '55%', borderRadius: 5 }} />
                <Shimmer style={{ height: 11, width: '35%', borderRadius: 5 }} />
              </div>
              <Shimmer style={{ height: 22, width: 70, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
