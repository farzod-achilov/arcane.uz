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

function WishCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="rounded-2xl flex gap-4 p-4"
         style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${delay}ms` }}>
      <Shimmer style={{ width: 80, height: 80, borderRadius: 12, flexShrink: 0 }} />
      <div className="flex-1 space-y-2.5">
        <Shimmer style={{ height: 16, width: '70%', borderRadius: 6 }} />
        <Shimmer style={{ height: 12, width: '40%', borderRadius: 6 }} />
        <div className="flex items-center gap-2 pt-1">
          <Shimmer style={{ height: 20, width: 80, borderRadius: 6 }} />
          <Shimmer style={{ height: 30, width: 110, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export default function WishlistLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer style={{ height: 10, width: 70, borderRadius: 4 }} />
            <Shimmer style={{ height: 32, width: 180, borderRadius: 10 }} />
          </div>
          <Shimmer style={{ height: 36, width: 120, borderRadius: 10 }} />
        </div>

        {/* List */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <WishCardSkeleton key={i} delay={i * 50} />
          ))}
        </div>
      </div>
    </div>
  );
}
