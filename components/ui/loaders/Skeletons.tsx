'use client';

/* ─────────────────────────────────────────────────────────
   Arcade skeleton loaders — premium dark shimmer placeholders
   Usage: import { SkeletonProductCard, SkeletonHero, ... }
───────────────────────────────────────────────────────────── */

import { motion } from 'framer-motion';

/* ── Base skeleton block ──────────────────────────────────
   Applies the shimmer CSS class from globals.css           */
function Bone({
  className = '',
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={style}
    />
  );
}

/* ── Shimmer sweep overlay (used for card-level shimmer) ── */
function ShimmerCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {children}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: ['-120%', '120%'] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.04) 40%, rgba(157,96,250,0.07) 50%, rgba(124,58,237,0.04) 60%, transparent 100%)',
          width: '80%',
        }}
      />
    </div>
  );
}

/* ── Product Card Skeleton ──────────────────────────────── */
export function SkeletonProductCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
    >
      <ShimmerCard
        className="rounded-xl overflow-hidden"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        {/* Cover image placeholder */}
        <div className="aspect-[2/3] skeleton" />

        {/* Info area */}
        <div className="px-3.5 pb-3.5 pt-3 space-y-2.5">
          <Bone className="h-3.5 w-4/5" />
          <Bone className="h-2.5 w-1/2" />
          <Bone className="h-2.5 w-3/4 mt-1" />
          <div className="flex items-center justify-between pt-1">
            <Bone className="h-4 w-1/3" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </ShimmerCard>
    </motion.div>
  );
}

/* ── Product Card Grid Skeleton ─────────────────────────── */
export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} index={i} />
      ))}
    </div>
  );
}

/* ── Hero Skeleton ──────────────────────────────────────── */
export function SkeletonHero() {
  return (
    <ShimmerCard className="relative w-full rounded-none" style={{ minHeight: '520px', background: '#08070F' } as React.CSSProperties}>
      {/* Background layers */}
      <div className="absolute inset-0 skeleton opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col gap-6">
        <Bone className="h-5 w-32 skeleton-purple rounded-full" />
        <Bone className="h-10 w-[55%] skeleton-purple" />
        <Bone className="h-10 w-[45%] skeleton-purple" />
        <Bone className="h-4 w-[40%] mt-1" />
        <Bone className="h-4 w-[35%]" />
        <div className="flex gap-3 mt-3">
          <Bone className="h-12 w-36 rounded-xl skeleton-purple" />
          <Bone className="h-12 w-28 rounded-xl" />
        </div>
      </div>
    </ShimmerCard>
  );
}

/* ── Category Card Skeleton ─────────────────────────────── */
export function SkeletonCategoryCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
    >
      <ShimmerCard
        className="rounded-2xl p-4 flex flex-col items-center gap-2.5"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        <Bone className="w-11 h-11 rounded-xl skeleton-purple" />
        <Bone className="h-2.5 w-12" />
        <Bone className="h-2 w-8" />
      </ShimmerCard>
    </motion.div>
  );
}

export function SkeletonCategories({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCategoryCard key={i} index={i} />
      ))}
    </div>
  );
}

/* ── Review Card Skeleton ───────────────────────────────── */
export function SkeletonReview({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
    >
      <ShimmerCard
        className="rounded-2xl p-5"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        {/* Header: avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <Bone className="w-10 h-10 rounded-xl flex-shrink-0 skeleton-purple" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3 w-28" />
            <Bone className="h-2.5 w-20" />
          </div>
          <Bone className="h-3 w-16 self-start" />
        </div>
        {/* Stars */}
        <Bone className="h-2.5 w-20 mb-3 skeleton-purple" />
        {/* Text lines */}
        <div className="space-y-2">
          <Bone className="h-2.5 w-full" />
          <Bone className="h-2.5 w-[90%]" />
          <Bone className="h-2.5 w-[75%]" />
        </div>
      </ShimmerCard>
    </motion.div>
  );
}

/* ── Checkout Skeleton ──────────────────────────────────── */
export function SkeletonCheckout() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_360px] gap-8">
      {/* Left: form */}
      <ShimmerCard
        className="rounded-2xl p-6 space-y-5"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        <Bone className="h-5 w-40 skeleton-purple mb-2" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Bone className="h-11 rounded-xl" />
          <Bone className="h-11 rounded-xl" />
        </div>
        <Bone className="h-11 rounded-xl" />
        <Bone className="h-11 rounded-xl" />
        <Bone className="h-5 w-32 skeleton-purple mt-2" />
        <div className="grid grid-cols-3 gap-3">
          <Bone className="h-16 rounded-xl" />
          <Bone className="h-16 rounded-xl" />
          <Bone className="h-16 rounded-xl" />
        </div>
        <Bone className="h-12 rounded-xl skeleton-purple mt-2" />
      </ShimmerCard>

      {/* Right: order summary */}
      <ShimmerCard
        className="rounded-2xl p-5 space-y-4 h-fit"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        <Bone className="h-4 w-32 skeleton-purple" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Bone className="w-14 h-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Bone className="h-3 w-3/4" />
              <Bone className="h-2.5 w-1/2" />
              <Bone className="h-3 w-1/3 skeleton-purple" />
            </div>
          </div>
        ))}
        <div className="border-t border-white/[0.05] pt-4 space-y-2">
          <div className="flex justify-between">
            <Bone className="h-3 w-16" />
            <Bone className="h-3 w-20" />
          </div>
          <div className="flex justify-between">
            <Bone className="h-4 w-12 skeleton-purple" />
            <Bone className="h-4 w-24 skeleton-purple" />
          </div>
        </div>
        <Bone className="h-12 rounded-xl skeleton-purple" />
      </ShimmerCard>
    </div>
  );
}

/* ── User Profile Skeleton ──────────────────────────────── */
export function SkeletonUserProfile() {
  return (
    <ShimmerCard
      className="rounded-2xl p-6 max-w-sm"
      style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <Bone className="w-20 h-20 rounded-2xl skeleton-purple mb-3" />
        <Bone className="h-4 w-32 mb-1.5" />
        <Bone className="h-3 w-24" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Bone className="h-5 w-10 skeleton-purple" />
            <Bone className="h-2.5 w-14" />
          </div>
        ))}
      </div>
      {/* Coins block */}
      <Bone className="h-12 w-full rounded-xl skeleton-purple mb-3" />
      <Bone className="h-10 w-full rounded-xl" />
    </ShimmerCard>
  );
}

/* ── Daily Deal Row Skeleton ────────────────────────────── */
export function SkeletonDealCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07 }}
    >
      <ShimmerCard
        className="rounded-xl p-3.5 flex gap-3.5"
        style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.055)' } as React.CSSProperties}
      >
        <Bone className="w-[76px] h-[100px] rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <Bone className="h-3.5 w-[85%]" />
          <Bone className="h-2.5 w-[65%]" />
          <Bone className="h-4 w-[45%] skeleton-purple" />
          <Bone className="h-2.5 w-[35%]" />
          <Bone className="h-7 w-24 rounded-lg skeleton-purple mt-1" />
        </div>
      </ShimmerCard>
    </motion.div>
  );
}
