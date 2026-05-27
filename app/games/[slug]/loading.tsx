function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: '#0D0D18', ...style }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default function GameLoading() {
  return (
    <div style={{ background: '#04040A', minHeight: '100vh', paddingTop: '72px' }}>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-2">
            <Shimmer style={{ height: '10px', width: '52px', borderRadius: '4px' }} />
            <span style={{ color: '#1F2937', fontSize: '12px' }}>›</span>
            <Shimmer style={{ height: '10px', width: '52px', borderRadius: '4px' }} />
            <span style={{ color: '#1F2937', fontSize: '12px' }}>›</span>
            <Shimmer style={{ height: '10px', width: '120px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 xl:gap-20 items-start">

          {/* LEFT: info + price */}
          <div>
            {/* Genre pills */}
            <div className="flex gap-2 mb-5">
              {[70, 84, 64].map((w, i) => (
                <Shimmer key={i} style={{ height: '24px', width: `${w}px`, borderRadius: '99px', animationDelay: `${i * 60}ms` }} />
              ))}
            </div>

            {/* Title */}
            <Shimmer style={{ height: '52px', width: '90%', borderRadius: '12px', marginBottom: '10px' }} />
            <Shimmer style={{ height: '36px', width: '60%', borderRadius: '12px', marginBottom: '16px' }} />

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(124,58,237,0.12)', marginBottom: '20px' }} />

            {/* Rating + date + developer */}
            <div className="flex items-center gap-4 mb-5">
              <Shimmer style={{ height: '18px', width: '100px', borderRadius: '6px' }} />
              <Shimmer style={{ height: '14px', width: '88px', borderRadius: '6px' }} />
              <Shimmer style={{ height: '14px', width: '96px', borderRadius: '6px' }} />
            </div>

            {/* Platform chips */}
            <div className="flex gap-2 mb-5">
              {[72, 60, 68].map((w, i) => (
                <Shimmer key={i} style={{ height: '34px', width: `${w}px`, borderRadius: '12px', animationDelay: `${i * 70}ms` }} />
              ))}
            </div>

            {/* Description lines */}
            <div className="space-y-2 mb-6">
              {[100, 96, 98, 88].map((w, i) => (
                <Shimmer key={i} style={{ height: '13px', width: `${w}%`, borderRadius: '4px', animationDelay: `${i * 40}ms` }} />
              ))}
            </div>

            {/* Developer / publisher row */}
            <div className="flex items-center gap-6 mb-6">
              <div className="space-y-1.5">
                <Shimmer style={{ height: '8px', width: '64px', borderRadius: '3px' }} />
                <Shimmer style={{ height: '13px', width: '100px', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.07)' }} />
              <div className="space-y-1.5">
                <Shimmer style={{ height: '8px', width: '52px', borderRadius: '3px' }} />
                <Shimmer style={{ height: '13px', width: '80px', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Price box */}
            <div
              className="rounded-3xl p-5 mb-4"
              style={{
                background: 'rgba(8,8,18,0.85)',
                border: '1px solid rgba(124,58,237,0.12)',
              }}
            >
              {/* Stock indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1A1A28', flexShrink: 0 }} />
                <Shimmer style={{ height: '12px', width: '100px', borderRadius: '4px' }} />
              </div>

              {/* Price + coins row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <Shimmer style={{ height: '40px', width: '160px', borderRadius: '8px', marginBottom: '6px' }} />
                  <Shimmer style={{ height: '11px', width: '72px', borderRadius: '4px' }} />
                </div>
                <Shimmer style={{ height: '28px', width: '140px', borderRadius: '10px' }} />
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 mb-2.5">
                <Shimmer style={{ flex: 1, height: '50px', borderRadius: '16px' }} />
                <Shimmer style={{ height: '50px', width: '54px', borderRadius: '16px' }} />
              </div>
              <Shimmer style={{ height: '44px', width: '100%', borderRadius: '16px' }} />
            </div>

            {/* Social proof */}
            <div className="flex flex-col gap-1.5 mb-4">
              {[140, 120, 110].map((w, i) => (
                <Shimmer key={i} style={{ height: '34px', borderRadius: '12px', animationDelay: `${i * 60}ms` }} />
              ))}
            </div>

            {/* Trust mini row */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[0, 1, 2].map(i => (
                <Shimmer key={i} style={{ height: '72px', borderRadius: '16px', animationDelay: `${i * 60}ms` }} />
              ))}
            </div>

            {/* Delivery note */}
            <Shimmer style={{ height: '60px', borderRadius: '16px' }} />
          </div>

          {/* RIGHT: 16:9 artwork */}
          <div className="lg:sticky lg:top-[100px]">
            <Shimmer
              style={{
                aspectRatio: '16/9',
                borderRadius: '20px',
                marginBottom: '16px',
                boxShadow: '0 0 60px rgba(124,58,237,0.08)',
              }}
            />
            {/* Thumbnail rail */}
            <div className="flex gap-2.5">
              {[1, 2, 3, 4].map(i => (
                <Shimmer
                  key={i}
                  style={{
                    width: '140px',
                    height: '80px',
                    borderRadius: '12px',
                    flexShrink: 0,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* System requirements */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 pb-12">
        <Shimmer style={{ height: '16px', width: '160px', borderRadius: '6px', marginBottom: '20px' }} />
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map(col => (
            <div
              key={col}
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(8,8,18,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <Shimmer style={{ height: '12px', width: '80px', borderRadius: '4px' }} />
              {[100, 90, 75, 85, 70].map((w, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Shimmer style={{ height: '11px', width: '70px', borderRadius: '3px' }} />
                  <Shimmer style={{ height: '11px', width: `${w - 20}px`, borderRadius: '3px' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Similar games strip */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1.5">
            <Shimmer style={{ height: '14px', width: '100px', borderRadius: '5px' }} />
            <Shimmer style={{ height: '10px', width: '140px', borderRadius: '4px' }} />
          </div>
          <Shimmer style={{ height: '32px', width: '80px', borderRadius: '8px' }} />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: '180px', background: '#0D0D18', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${i * 40}ms` }}
            >
              <Shimmer style={{ aspectRatio: '2/3', borderRadius: 0 }} />
              <div className="p-2.5 space-y-1.5">
                <Shimmer style={{ height: '12px', width: '85%', borderRadius: '4px' }} />
                <Shimmer style={{ height: '10px', width: '55%', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
