'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useUser } from '@/lib/userContext';

interface ProductCardProps {
  product: Product;
  index?: number;
}

/* ── Badge config ─────────────────────────────────────── */
const badgeCfg: Record<string, { bg: string; text: string; label: string; glow: string }> = {
  hot:       { bg: '#EF4444',  text: '#fff',    label: 'HOT',  glow: 'rgba(239,68,68,0.5)' },
  new:       { bg: '#06B6D4',  text: '#fff',    label: 'NEW',  glow: 'rgba(6,182,212,0.5)' },
  sale:      { bg: '#7C3AED',  text: '#fff',    label: 'SALE', glow: 'rgba(124,58,237,0.5)' },
  exclusive: { bg: '#F59E0B',  text: '#000',    label: 'EXCL', glow: 'rgba(245,158,11,0.5)' },
};

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const badge = product.badge ? badgeCfg[product.badge] : null;
  const { isLoggedIn, isInWishlist, addToWishlist, removeFromWishlist } = useUser();
  const wishlisted = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    wishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, delay: index * 0.065, ease: 'easeOut' }}
      className="group relative"
    >
      <Link href={`/product/${product.id}`}>
        <div
          className="relative overflow-hidden rounded-xl flex flex-col transition-all duration-350"
          style={{
            background: '#0D0D16',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(124,58,237,0.45)';
            el.style.boxShadow =
              '0 0 30px rgba(124,58,237,0.18), 0 12px 40px rgba(0,0,0,0.55)';
            el.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.boxShadow = 'none';
            el.style.transform = 'translateY(0)';
          }}
        >

          {/* ── COVER IMAGE ── */}
          <div className="relative aspect-[2/3] overflow-hidden flex-shrink-0">
            <Image
              src={product.image}
              alt={product.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />

            {/* Cinematic gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.0) 45%, rgba(13,13,22,0.55) 72%, #0D0D16 100%)',
              }}
            />

            {/* Subtle scanline texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 4px)',
              }}
            />

            {/* ── Status badge — top left ── */}
            {badge && (
              <div
                className="absolute top-2.5 left-2.5 font-pixel rounded"
                style={{
                  background: badge.bg,
                  color: badge.text,
                  fontSize: '8px',
                  padding: '3px 6px',
                  letterSpacing: '0.06em',
                  boxShadow: `0 0 10px ${badge.glow}`,
                }}
              >
                {badge.label}
              </div>
            )}

            {/* ── Discount badge — top right ── */}
            {product.discount && (
              <div
                className="absolute top-2.5 right-2.5 font-pixel rounded"
                style={{
                  background: 'rgba(239,68,68,0.92)',
                  color: '#fff',
                  fontSize: '8px',
                  padding: '3px 6px',
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                -{product.discount}%
              </div>
            )}

            {/* ── Platform chips — bottom left (inside image) ── */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 flex-wrap">
              {product.platform.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="font-pixel"
                  style={{
                    fontSize: '7px',
                    letterSpacing: '0.05em',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(6px)',
                    color: '#9CA3AF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>

            {/* ── Wishlist — bottom right (shows on hover) ── */}
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Убрать из вишлиста' : 'Добавить в вишлист'}
              className="absolute bottom-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{
                background: wishlisted ? 'rgba(239,68,68,0.15)' : 'rgba(10,10,15,0.75)',
                border: wishlisted ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                color: wishlisted ? '#F87171' : '#6B7280',
                boxShadow: wishlisted ? '0 0 8px rgba(239,68,68,0.25)' : 'none',
              }}
            >
              <Heart
                className="w-3.5 h-3.5"
                style={{ fill: wishlisted ? '#F87171' : 'none' }}
              />
            </button>
          </div>

          {/* ── INFO ── */}
          <div className="px-3.5 pb-3.5 pt-3 flex flex-col flex-1">

            {/* Title */}
            <h3
              className="font-heading font-semibold text-white leading-tight line-clamp-1 mb-0.5"
              style={{ fontSize: '13.5px' }}
            >
              {product.title}
            </h3>

            {/* Subtitle */}
            {product.subtitle && (
              <p
                className="font-body line-clamp-1 mb-2.5"
                style={{ fontSize: '11px', color: '#374151' }}
              >
                {product.subtitle}
              </p>
            )}

            {/* Meta row: rating + instant + region */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B] flex-shrink-0" />
                <span
                  className="font-body text-[#9CA3AF]"
                  style={{ fontSize: '11px' }}
                >
                  {product.rating}
                </span>
                <span
                  className="font-body text-[#374151]"
                  style={{ fontSize: '10px' }}
                >
                  ({product.reviews >= 1000
                    ? (product.reviews / 1000).toFixed(1) + 'K'
                    : product.reviews})
                </span>
              </div>

              <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>

              {/* Instant delivery */}
              {product.inStock && (
                <div className="flex items-center gap-0.5">
                  <Zap
                    className="flex-shrink-0"
                    style={{ width: '10px', height: '10px', color: '#22C55E' }}
                  />
                  <span
                    className="font-body text-[#22C55E]"
                    style={{ fontSize: '10.5px' }}
                  >
                    Мгновенно
                  </span>
                </div>
              )}

              <span style={{ color: '#1F2937', fontSize: '10px' }}>·</span>

              {/* Region */}
              <span
                className="font-body text-[#374151]"
                style={{ fontSize: '10px', letterSpacing: '0.04em' }}
              >
                RU/CIS
              </span>
            </div>

            {/* Price row */}
            <div className="flex items-end justify-between gap-2 mt-auto">
              <div className="flex flex-col leading-none">
                <span
                  className="font-heading font-bold text-white"
                  style={{ fontSize: '15px' }}
                >
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span
                    className="font-body line-through mt-0.5"
                    style={{ fontSize: '11px', color: '#374151' }}
                  >
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Cart button — appears on hover */}
              <button
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.35)',
                  color: '#fff',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    '0 0 14px rgba(124,58,237,0.65), 0 0 0 1px rgba(124,58,237,0.5)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    '0 0 0 1px rgba(124,58,237,0.35)';
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
