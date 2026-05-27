/* Catalog skeleton — matches the actual CatalogContent layout */
function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: '#12121A', ...style }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${delay}ms` }}
    >
      {/* Cover */}
      <Shimmer style={{ aspectRatio: '2/3', borderRadius: 0 }} />
      {/* Info */}
      <div className="p-3 space-y-2.5">
        <Shimmer style={{ height: '14px', width: '85%', borderRadius: '6px' }} />
        <Shimmer style={{ height: '11px', width: '60%', borderRadius: '6px' }} />
        <div className="flex items-center justify-between pt-1">
          <Shimmer style={{ height: '16px', width: '45%', borderRadius: '6px' }} />
          <Shimmer style={{ height: '28px', width: '28px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}

export default function CatalogLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%);  }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #0D0A1A, #0A0A0F)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Shimmer style={{ height: '10px', width: '80px', borderRadius: '4px', marginBottom: '10px' }} />
          <Shimmer style={{ height: '36px', width: '200px', borderRadius: '10px' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Toolbar */}
        <div className="flex gap-3 mb-7">
          <Shimmer className="flex-1" style={{ height: '42px', borderRadius: '12px' }} />
          <Shimmer style={{ height: '42px', width: '180px', borderRadius: '12px' }} />
          <Shimmer style={{ height: '42px', width: '80px', borderRadius: '12px' }} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-2.5 flex-shrink-0" style={{ width: '224px' }}>
            <Shimmer style={{ height: '10px', width: '90px', borderRadius: '4px', marginBottom: '4px' }} />
            {[1, 2, 3].map(i => (
              <Shimmer key={i} style={{ height: '38px', borderRadius: '10px', animationDelay: `${i * 60}ms` }} />
            ))}
            <Shimmer style={{ height: '10px', width: '70px', borderRadius: '4px', marginTop: '12px', marginBottom: '4px' }} />
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Shimmer key={i} style={{ height: '34px', borderRadius: '10px', animationDelay: `${(i + 3) * 60}ms` }} />
            ))}
            {/* Price range */}
            <Shimmer style={{ height: '10px', width: '70px', borderRadius: '4px', marginTop: '12px', marginBottom: '4px' }} />
            <Shimmer style={{ height: '48px', borderRadius: '10px' }} />
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <CardSkeleton key={i} delay={i * 30} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
