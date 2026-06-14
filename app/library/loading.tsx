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

function GameCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${delay}ms` }}>
      <Shimmer style={{ aspectRatio: '460/215', borderRadius: 0 }} />
      <div className="p-4 space-y-2.5">
        <Shimmer style={{ height: 16, width: '80%', borderRadius: 6 }} />
        <Shimmer style={{ height: 12, width: '50%', borderRadius: 6 }} />
        <div className="flex gap-2 pt-1">
          <Shimmer style={{ height: 28, flex: 1, borderRadius: 8 }} />
          <Shimmer style={{ height: 28, width: 60, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function LibraryLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Shimmer style={{ height: 10, width: 80, borderRadius: 4, marginBottom: 10 }} />
          <Shimmer style={{ height: 36, width: 220, borderRadius: 10 }} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[1,2,3].map(i => (
            <Shimmer key={i} style={{ height: 36, width: 100, borderRadius: 10 }} />
          ))}
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GameCardSkeleton key={i} delay={i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}
