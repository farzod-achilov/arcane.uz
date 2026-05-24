'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Heart, Share2, ChevronRight,
  Check, Globe, Monitor, Gamepad2, Tag, Shield, Zap,
  MessageCircle, Clock, ExternalLink,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Calendar, Maximize2, Users, Gamepad, PlaySquare, Cpu,
  Play, Award, Sparkles, TrendingUp,
} from 'lucide-react';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { arcaneGameToProduct } from '@/lib/arcaneMapper';
import type { ArcaneGameResponse } from '@/lib/arcaneApi';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/ui/ProductCard';
import DeliveryInfoCard from '@/components/ui/DeliveryInfoCard';
import TrustIndicators    from '@/components/product/TrustIndicators';
import EditionsSection    from '@/components/product/EditionsSection';
import SystemRequirements from '@/components/product/SystemRequirements';
import ActivationGuide    from '@/components/product/ActivationGuide';
import ProductFAQ         from '@/components/product/ProductFAQ';
import ProductReviews     from '@/components/product/ProductReviews';
import StickyPurchasePanel   from '@/components/product/StickyPurchasePanel';
import FullscreenGallery     from '@/components/product/FullscreenGallery';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
    || url.includes('video.cloudflare.steamstatic.com')
    || url.includes('youtube.com/embed');
}
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/embed');
}

const BADGE_CFG: Record<string, { bg: string; label: string; glow: string }> = {
  hot:      { bg: 'linear-gradient(135deg, #EF4444, #F97316)', label: 'HOT',       glow: 'rgba(239,68,68,0.6)' },
  new:      { bg: 'linear-gradient(135deg, #06B6D4, #7C3AED)', label: 'NEW',       glow: 'rgba(6,182,212,0.6)' },
  sale:     { bg: '#EF4444',                                     label: 'SALE',      glow: 'rgba(239,68,68,0.6)' },
  exclusive:{ bg: 'linear-gradient(135deg, #7C3AED, #06B6D4)', label: 'EXCLUSIVE', glow: 'rgba(124,58,237,0.6)' },
  preorder: { bg: 'linear-gradient(135deg, #F59E0B, #EF4444)',  label: 'PRE-ORDER', glow: 'rgba(245,158,11,0.6)' },
};

/* ── Platform glow config ─────────────────────────────── */
function getPlatformStyle(p: string, active: boolean) {
  const isSteam  = p === 'Steam';
  const isPS     = p.includes('PS') || p.includes('PlayStation');
  const isXbox   = p.includes('Xbox');

  let gradientBg = 'linear-gradient(135deg, #7C3AED, #5B21B6)';
  let glowColor  = 'rgba(124,58,237,0.5)';

  if (isSteam) { gradientBg = 'linear-gradient(135deg, #1b2838, #2a475e)'; glowColor = 'rgba(100,149,195,0.6)'; }
  if (isPS)    { gradientBg = 'linear-gradient(135deg, #00439c, #003087)'; glowColor = 'rgba(0,100,200,0.6)'; }
  if (isXbox)  { gradientBg = 'linear-gradient(135deg, #107c10, #0e6b0e)'; glowColor = 'rgba(16,124,16,0.6)'; }

  return {
    background: active ? gradientBg : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#fff' : '#4B5563',
    boxShadow: active ? `0 0 24px ${glowColor}, 0 4px 20px rgba(0,0,0,0.4)` : 'none',
    transform: active ? 'translateY(-1px)' : 'none',
  };
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ProductPage({ params }: { params: { id: string } }) {
  const mockProduct = products.find((p) => p.id === params.id);

  const [product, setProduct]           = useState<Product | null>(mockProduct ?? null);
  const [loading, setLoading]           = useState(!mockProduct);
  const [notFoundErr, setNotFoundErr]   = useState(false);
  const [activeImg, setActiveImg]       = useState(0);
  const [fullscreen, setFullscreen]     = useState(false);
  const [selectedPlatform, setPlatform] = useState(mockProduct?.platform[0] ?? '');
  const [addedToCart, setAdded]         = useState(false);
  const [wishlisted, setWishlisted]     = useState(false);
  const buyButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mockProduct) return;
    fetch(`/api/arcane/games/${params.id}`)
      .then(r => r.json())
      .then((res: ArcaneGameResponse) => {
        if (res.success && res.data) {
          const p = arcaneGameToProduct(res.data);
          setProduct(p);
          setPlatform(p.platform[0] ?? '');
        } else setNotFoundErr(true);
      })
      .catch(() => setNotFoundErr(true))
      .finally(() => setLoading(false));
  }, [params.id, mockProduct]);

  const allScreenshots = product ? [
    product.image,
    ...(product.trailer ? [product.trailer] : []),
    ...(product.screenshots ?? []),
  ] : [];

  const closeFullscreen = useCallback(() => setFullscreen(false), []);
  const openFullscreen  = useCallback(() => setFullscreen(true),  []);

  useEffect(() => {
    if (fullscreen || !product) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveImg(i => (i === 0 ? allScreenshots.length - 1 : i - 1));
      if (e.key === 'ArrowRight') setActiveImg(i => (i === allScreenshots.length - 1 ? 0 : i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, allScreenshots.length, product]);

  if (notFoundErr) notFound();

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04040A' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const handleAddToCart = () => { setAdded(true); setTimeout(() => setAdded(false), 2200); };
  const discount      = product.discount ?? 0;
  const originalPrice = product.originalPrice ?? product.price;
  const prevImg = () => setActiveImg(i => (i === 0 ? allScreenshots.length - 1 : i - 1));
  const nextImg = () => setActiveImg(i => (i === allScreenshots.length - 1 ? 0 : i + 1));

  return (
    <>
      <AnimatePresence>
        {fullscreen && (
          <FullscreenGallery
            images={allScreenshots.filter(s => !isVideoUrl(s))}
            startIndex={allScreenshots.slice(0, activeImg + 1).filter(s => !isVideoUrl(s)).length - 1}
            onClose={closeFullscreen}
          />
        )}
      </AnimatePresence>
      <StickyPurchasePanel product={product} buyButtonRef={buyButtonRef} />

      {/* ═══════════════════════════════════════════
          PAGE SHELL
      ═══════════════════════════════════════════ */}
      <div style={{ background: '#04040A', minHeight: '100vh', position: 'relative', paddingTop: '80px' }}>

        {/* ── Ambient blurred artwork bg ── */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, overflow: 'hidden' }}>
          <Image
            src={product.image} alt="" fill unoptimized priority
            className="object-cover"
            style={{ filter: 'blur(100px) saturate(0.25) brightness(0.1)', transform: 'scale(1.15)' }}
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(4,4,10,0.65) 0%, rgba(4,4,10,0.85) 30%, rgba(4,4,10,0.97) 60%, #04040A 100%)',
          }} />
        </div>

        {/* ── Grid overlay ── */}
        <div className="fixed inset-0 pointer-events-none" style={{
          zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
          opacity: 0.016,
        }} />

        {/* ── Top radial glow ── */}
        <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{
          zIndex: 0,
          height: '700px',
          background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)',
        }} />

        <style>{`
          @keyframes shimmer { 0%{transform:translateX(-120%)} 100%{transform:translateX(200%)} }
          @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes pulse-glow { 0%,100%{opacity:.6} 50%{opacity:1} }
          .thumb-rail::-webkit-scrollbar { height: 4px; }
          .thumb-rail::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
          .thumb-rail::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }
        `}</style>

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ═══ BREADCRUMB ═══ */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-3">
              <div className="flex items-center gap-2 font-body" style={{ fontSize: '12px', color: '#374151' }}>
                <Link href="/" className="hover:text-white transition-colors">Главная</Link>
                <ChevronRight style={{ width: '12px', height: '12px' }} />
                <Link href="/catalog" className="hover:text-white transition-colors">Каталог</Link>
                <ChevronRight style={{ width: '12px', height: '12px' }} />
                <span style={{ color: '#6B7280' }} className="truncate max-w-[200px]">{product.title}</span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              HERO: LEFT info + RIGHT artwork
          ═══════════════════════════════════════════ */}
          <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
            <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 xl:gap-20 items-start">

              {/* ─────────────────────────────────────
                  LEFT: All game info
              ───────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <Link
                    href={`/catalog?category=${product.category}`}
                    className="flex items-center gap-1.5 font-pixel capitalize"
                    style={{
                      fontSize: '9px', letterSpacing: '0.1em',
                      color: '#9D60FA',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      padding: '5px 12px', borderRadius: '99px',
                    }}
                  >
                    <Sparkles style={{ width: '8px', height: '8px' }} />
                    {product.category}
                  </Link>
                  {product.badge && BADGE_CFG[product.badge] && (
                    <span className="font-pixel" style={{
                      fontSize: '9px', letterSpacing: '0.1em',
                      padding: '5px 12px', borderRadius: '99px',
                      background: BADGE_CFG[product.badge].bg, color: '#fff',
                      boxShadow: `0 0 16px ${BADGE_CFG[product.badge].glow}`,
                    }}>
                      {BADGE_CFG[product.badge].label}
                    </span>
                  )}
                  {product.preorder && (
                    <span className="font-pixel flex items-center gap-1" style={{
                      fontSize: '9px', letterSpacing: '0.1em',
                      padding: '5px 12px', borderRadius: '99px',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#F59E0B',
                    }}>
                      <Clock style={{ width: '8px', height: '8px' }} />
                      ПРЕДЗАКАЗ
                    </span>
                  )}
                </div>

                {/* Game title */}
                <h1 className="font-heading font-bold text-white mb-2" style={{
                  fontSize: 'clamp(32px, 5vw, 58px)',
                  lineHeight: '1.03',
                  letterSpacing: '-0.025em',
                  textShadow: '0 0 80px rgba(124,58,237,0.25)',
                }}>
                  {product.title}
                </h1>

                {product.subtitle && (
                  <p className="font-body mb-5" style={{ color: '#6B7280', fontSize: '15px' }}>
                    {product.subtitle}
                  </p>
                )}

                {/* Accent divider */}
                <div className="mb-5" style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)',
                }} />

                {/* Rating + date */}
                <div className="flex flex-wrap items-center gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} style={{
                          width: '15px', height: '15px',
                          color: s <= Math.round(product.rating) ? '#F59E0B' : '#1F2937',
                          fill: s <= Math.round(product.rating) ? '#F59E0B' : 'transparent',
                        }} />
                      ))}
                    </div>
                    <span className="font-heading font-bold" style={{ color: '#F59E0B', fontSize: '17px' }}>
                      {product.rating}
                    </span>
                    <span className="font-body" style={{ color: '#374151', fontSize: '12px' }}>
                      ({product.reviews.toLocaleString()} отзывов)
                    </span>
                  </div>
                  {product.releaseDate && (
                    <div className="flex items-center gap-1.5" style={{ color: '#374151', fontSize: '12px' }}>
                      <Calendar style={{ width: '11px', height: '11px', color: '#4B5563' }} />
                      <span className="font-body">
                        {new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Genre tags */}
                {product.genres && product.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {product.genres.map(g => (
                      <span key={g} className="font-body" style={{
                        fontSize: '11px', color: '#9CA3AF',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '4px 12px', borderRadius: '99px',
                        backdropFilter: 'blur(8px)',
                      }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="font-body leading-relaxed mb-6" style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.75' }}>
                  {product.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                  {product.features.slice(0, 6).map((f, i) => (
                    <motion.div
                      key={f}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-2.5"
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))',
                        border: '1px solid rgba(124,58,237,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check style={{ width: '10px', height: '10px', color: '#9D60FA' }} />
                      </div>
                      <span className="font-body" style={{ color: '#9CA3AF', fontSize: '13px' }}>{f}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Developer info */}
                {(product.developer || product.publisher) && (
                  <div className="flex items-center gap-4 mb-6">
                    {product.developer && (
                      <div>
                        <p className="font-pixel uppercase mb-0.5" style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#374151' }}>Разработчик</p>
                        <p className="font-body" style={{ color: '#6B7280', fontSize: '13px' }}>{product.developer}</p>
                      </div>
                    )}
                    {product.publisher && product.publisher !== product.developer && (
                      <>
                        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.07)' }} />
                        <div>
                          <p className="font-pixel uppercase mb-0.5" style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#374151' }}>Издатель</p>
                          <p className="font-body" style={{ color: '#6B7280', fontSize: '13px' }}>{product.publisher}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Platform selector */}
                <div className="mb-6">
                  <p className="font-pixel uppercase mb-3" style={{ fontSize: '8px', letterSpacing: '0.12em', color: '#374151' }}>
                    Платформа / Магазин
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.platform.map(p => {
                      const isPC = ['PC','Steam','Epic Games','EA App','Ubisoft Connect'].includes(p);
                      return (
                        <motion.button
                          key={p}
                          onClick={() => setPlatform(p)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          className="flex items-center gap-2 font-heading font-semibold transition-all duration-300"
                          style={{
                            padding: '9px 18px', borderRadius: '12px', fontSize: '12px',
                            ...getPlatformStyle(p, selectedPlatform === p),
                          }}
                        >
                          {isPC ? <Monitor style={{ width: '13px', height: '13px' }} /> : <Gamepad2 style={{ width: '13px', height: '13px' }} />}
                          {p}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Preorder notice */}
                {product.preorder && product.releaseDate && (
                  <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}>
                    <Clock style={{ width: '16px', height: '16px', color: '#F59E0B', flexShrink: 0 }} />
                    <div>
                      <p className="font-heading font-semibold" style={{ color: '#F59E0B', fontSize: '13px' }}>Игра ещё не вышла</p>
                      <p className="font-body" style={{ color: '#6B7280', fontSize: '12px' }}>
                        Дата выхода: {new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── PRICE BOX ── */}
                <div ref={buyButtonRef}>
                  <div className="rounded-3xl p-5 mb-4" style={{
                    background: 'rgba(8,8,18,0.85)',
                    border: '1px solid rgba(124,58,237,0.18)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                    {/* Discount */}
                    {discount > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-pixel" style={{
                          fontSize: '9px', letterSpacing: '0.06em',
                          padding: '4px 10px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #EF4444, #F97316)', color: '#fff',
                          boxShadow: '0 0 14px rgba(239,68,68,0.45)',
                        }}>
                          -{discount}%
                        </span>
                        <span className="font-body line-through" style={{ color: '#374151', fontSize: '14px' }}>
                          {formatPrice(originalPrice)}
                        </span>
                        <span className="font-body" style={{ color: '#22C55E', fontSize: '12px' }}>
                          — сэкономь {formatPrice(originalPrice - product.price)}
                        </span>
                      </div>
                    )}

                    {/* Price + coins row */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-heading font-bold" style={{
                        fontSize: 'clamp(26px, 4vw, 36px)',
                        letterSpacing: '-0.025em', color: '#fff',
                        textShadow: '0 0 40px rgba(255,255,255,0.08)',
                      }}>
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.2)',
                      }}>
                        <Zap style={{ width: '11px', height: '11px', color: '#9D60FA' }} />
                        <span className="font-heading font-semibold" style={{ color: '#9D60FA', fontSize: '11px' }}>
                          +{Math.round(product.price / 1000)} Arcane Coins
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        onClick={handleAddToCart}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 relative overflow-hidden rounded-2xl font-heading font-bold flex items-center justify-center gap-2"
                        style={{
                          padding: '15px 24px', fontSize: '14px', letterSpacing: '0.02em', color: '#fff',
                          background: addedToCart
                            ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                            : 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 45%, #0891B2 100%)',
                          boxShadow: addedToCart
                            ? '0 0 32px rgba(34,197,94,0.5), 0 8px 24px rgba(0,0,0,0.5)'
                            : '0 0 40px rgba(124,58,237,0.45), 0 0 80px rgba(124,58,237,0.15), 0 8px 24px rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {/* Shimmer */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)',
                          animation: 'shimmer 2.8s ease infinite',
                        }} />
                        <AnimatePresence mode="wait">
                          {addedToCart ? (
                            <motion.span key="ok" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 relative z-10">
                              <Check style={{ width: '16px', height: '16px' }} /> Добавлено!
                            </motion.span>
                          ) : (
                            <motion.span key="buy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 relative z-10">
                              <ShoppingCart style={{ width: '16px', height: '16px' }} />
                              {product.preorder ? 'Предзаказать' : 'Купить сейчас'}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <motion.button
                        onClick={() => setWishlisted(v => !v)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        className="rounded-2xl flex items-center justify-center"
                        style={{
                          padding: '15px 16px',
                          background: wishlisted ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${wishlisted ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          color: wishlisted ? '#F87171' : '#374151',
                          boxShadow: wishlisted ? '0 0 20px rgba(239,68,68,0.25)' : 'none',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <Heart style={{ width: '20px', height: '20px', fill: wishlisted ? '#F87171' : 'transparent' }} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.93 }}
                        className="rounded-2xl flex items-center justify-center"
                        style={{
                          padding: '15px 16px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#374151',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <Share2 style={{ width: '18px', height: '18px' }} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Trust mini row */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: Shield, label: 'Гарантия', sub: 'Подлинности' },
                    { icon: Globe,  label: 'RU / CIS',  sub: 'Регион' },
                    { icon: Check,  label: 'Проверено', sub: 'Вручную' },
                  ].map(item => (
                    <div key={item.label} className="flex flex-col items-center text-center gap-1.5 rounded-2xl py-3.5" style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <item.icon style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
                      <span className="font-heading font-semibold" style={{ color: '#9CA3AF', fontSize: '11px' }}>{item.label}</span>
                      <span className="font-body" style={{ color: '#374151', fontSize: '10px' }}>{item.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery */}
                <div className="mb-5">
                  <p className="font-pixel uppercase mb-2.5" style={{ fontSize: '8px', letterSpacing: '0.12em', color: '#374151' }}>
                    Способ доставки
                  </p>
                  <DeliveryInfoCard
                    deliveryType={product.deliveryType}
                    deliveryTime={product.deliveryTime}
                    deliveryDescription={product.deliveryDescription}
                    variant="full" animated
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.slice(0, 10).map(tag => (
                    <span key={tag} className="flex items-center gap-1 font-body" style={{
                      fontSize: '10px', color: '#374151',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '3px 8px', borderRadius: '6px',
                    }}>
                      <Tag style={{ width: '8px', height: '8px' }} />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* ─────────────────────────────────────
                  RIGHT: Cinematic artwork
              ───────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative lg:sticky lg:top-24"
              >
                {/* Artwork glow halo */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  borderRadius: '28px',
                  background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.2) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.1)',
                  zIndex: -1,
                }} />

                {/* Main 16:9 artwork frame */}
                <div className="relative rounded-[24px] overflow-hidden" style={{
                  aspectRatio: '16/9',
                  border: '1px solid rgba(124,58,237,0.2)',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 0 80px rgba(124,58,237,0.2), 0 40px 100px rgba(0,0,0,0.7)',
                  background: '#07070F',
                }}>
                  <Image
                    src={product.image} alt={product.title}
                    fill priority unoptimized
                    className="object-cover"
                    style={{ transition: 'transform 10s ease' }}
                  />

                  {/* Overlays */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to top, rgba(4,4,10,0.75) 0%, rgba(4,4,10,0.1) 45%, transparent 70%)',
                  }} />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to right, rgba(4,4,10,0.35) 0%, transparent 35%)',
                  }} />

                  {/* Trailer play button */}
                  {product.trailer && (
                    <button
                      onClick={() => setActiveImg(allScreenshots.findIndex(s => isVideoUrl(s)))}
                      className="absolute inset-0 flex items-center justify-center group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center"
                        style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '2px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 0 40px rgba(255,255,255,0.08)',
                        }}
                      >
                        <Play style={{ width: '22px', height: '22px', color: '#fff', fill: '#fff', marginLeft: '3px' }} />
                      </motion.div>
                    </button>
                  )}

                  {/* Discount badge */}
                  {discount > 0 && (
                    <div className="absolute top-4 right-4 font-heading font-bold" style={{
                      fontSize: '15px', padding: '6px 14px', borderRadius: '12px',
                      background: 'rgba(239,68,68,0.92)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(239,68,68,0.5)',
                      border: '1px solid rgba(255,100,100,0.4)',
                    }}>
                      -{discount}%
                    </div>
                  )}

                  {/* Developer chip */}
                  {product.developer && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2" style={{
                      background: 'rgba(4,4,10,0.75)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 12px', borderRadius: '10px',
                    }}>
                      <Cpu style={{ width: '11px', height: '11px', color: '#7C3AED' }} />
                      <span className="font-body" style={{ color: '#9CA3AF', fontSize: '11px' }}>{product.developer}</span>
                    </div>
                  )}

                  {/* Screenshot count chip */}
                  {allScreenshots.length > 1 && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5" style={{
                      background: 'rgba(4,4,10,0.75)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '6px 10px', borderRadius: '10px',
                    }}>
                      <Maximize2 style={{ width: '10px', height: '10px', color: '#6B7280' }} />
                      <span className="font-body" style={{ color: '#6B7280', fontSize: '10px' }}>
                        {allScreenshots.length - 1} скриншотов
                      </span>
                    </div>
                  )}
                </div>

                {/* Floating glow under card */}
                <div className="absolute pointer-events-none" style={{
                  bottom: '-30px', left: '10%', right: '10%', height: '60px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(124,58,237,0.35) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }} />

                {/* ── Floating stat: Rating ── */}
                {product.reviews > 1000 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, y: -5 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="absolute rounded-2xl px-4 py-3"
                    style={{
                      top: '-12px', right: '-16px',
                      background: 'rgba(8,8,18,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      boxShadow: '0 0 30px rgba(245,158,11,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                      animation: 'float 4s ease-in-out infinite',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Star style={{ width: '14px', height: '14px', color: '#F59E0B', fill: '#F59E0B' }} />
                      </div>
                      <div>
                        <p className="font-heading font-bold" style={{ color: '#fff', fontSize: '18px', lineHeight: 1 }}>{product.rating}</p>
                        <p className="font-body" style={{ color: '#4B5563', fontSize: '10px', marginTop: '2px' }}>
                          {product.reviews.toLocaleString()} отзывов
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Floating stat: Award ── */}
                {product.rating >= 4.5 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    className="absolute rounded-2xl px-4 py-3"
                    style={{
                      bottom: '20px', left: '-18px',
                      background: 'rgba(8,8,18,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      boxShadow: '0 0 30px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.5)',
                      animation: 'float 5s ease-in-out 1s infinite',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Award style={{ width: '18px', height: '18px', color: '#9D60FA' }} />
                      <div>
                        <p className="font-heading font-semibold" style={{ color: '#fff', fontSize: '11px' }}>Выбор редакции</p>
                        <p className="font-body" style={{ color: '#4B5563', fontSize: '10px' }}>Arcane.uz 2024</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Floating: Trending if hot ── */}
                {product.badge === 'hot' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="absolute rounded-2xl px-3 py-2"
                    style={{
                      top: '50%', right: '-18px',
                      background: 'rgba(8,8,18,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      boxShadow: '0 0 20px rgba(239,68,68,0.1)',
                      animation: 'float 3.5s ease-in-out 0.5s infinite',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp style={{ width: '14px', height: '14px', color: '#F87171' }} />
                      <span className="font-heading font-semibold" style={{ color: '#F87171', fontSize: '11px' }}>Trending</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              GALLERY SECTION
          ═══════════════════════════════════════════ */}
          {allScreenshots.length > 1 && (
            <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '48px', paddingBottom: '48px' }}>
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <div style={{
                    width: '3px', height: '22px',
                    background: 'linear-gradient(to bottom, #7C3AED, #06B6D4)',
                    borderRadius: '2px',
                  }} />
                  <h2 className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
                    Скриншоты и Видео
                  </h2>
                  <span className="font-body" style={{ color: '#374151', fontSize: '12px' }}>
                    {allScreenshots.length} медиафайлов
                  </span>
                </div>

                {/* Large preview */}
                <div
                  className="group relative rounded-[20px] overflow-hidden mb-4"
                  style={{
                    aspectRatio: '16/7',
                    maxHeight: '520px',
                    background: '#05050E',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 0 80px rgba(0,0,0,0.6)',
                    cursor: isVideoUrl(allScreenshots[activeImg]) ? 'default' : 'zoom-in',
                  }}
                  onClick={() => { if (!isVideoUrl(allScreenshots[activeImg])) openFullscreen(); }}
                >
                  <AnimatePresence mode="wait">
                    {isYouTubeUrl(allScreenshots[activeImg]) ? (
                      <motion.iframe
                        key={`yt-${activeImg}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        src={allScreenshots[activeImg]}
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen" allowFullScreen
                        style={{ border: 'none' }}
                      />
                    ) : isVideoUrl(allScreenshots[activeImg]) ? (
                      <motion.video
                        key={`v-${activeImg}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        src={allScreenshots[activeImg]}
                        autoPlay loop muted playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <motion.div
                        key={activeImg}
                        initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={allScreenshots[activeImg]}
                          alt={`${product.title} screenshot ${activeImg + 1}`}
                          fill unoptimized
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'linear-gradient(to top, rgba(4,4,10,0.55) 0%, transparent 40%)',
                  }} />

                  {/* Video badge */}
                  {isVideoUrl(allScreenshots[activeImg]) && (
                    <div className="absolute top-4 left-4 font-pixel flex items-center gap-1.5" style={{
                      fontSize: '9px', letterSpacing: '0.08em',
                      padding: '5px 12px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #EF4444, #F97316)', color: '#fff',
                      boxShadow: '0 0 16px rgba(239,68,68,0.5)',
                    }}>
                      ▶ ВИДЕО
                    </div>
                  )}

                  {/* Counter */}
                  <div className="absolute bottom-4 left-4 font-body" style={{
                    fontSize: '11px', color: '#6B7280',
                    background: 'rgba(4,4,10,0.7)', backdropFilter: 'blur(8px)',
                    padding: '4px 10px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {activeImg + 1} / {allScreenshots.length}
                  </div>

                  {/* Fullscreen btn */}
                  {!isVideoUrl(allScreenshots[activeImg]) && (
                    <div className="absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200" style={{
                      background: 'rgba(4,4,10,0.75)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <Maximize2 style={{ width: '16px', height: '16px', color: '#fff' }} />
                    </div>
                  )}

                  {/* Arrows */}
                  {allScreenshots.length > 1 && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); prevImg(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        style={{ background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <ChevronLeft style={{ width: '18px', height: '18px', color: '#fff' }} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); nextImg(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        style={{ background: 'rgba(4,4,10,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <ChevronRightIcon style={{ width: '18px', height: '18px', color: '#fff' }} />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail rail */}
                <div className="thumb-rail flex gap-2.5 overflow-x-auto pb-2">
                  {allScreenshots.map((src, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-300"
                      style={{
                        width: '140px', height: '80px',
                        border: `2px solid ${i === activeImg ? (isVideoUrl(src) ? '#EF4444' : '#7C3AED') : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: i === activeImg ? (isVideoUrl(src) ? '0 0 18px rgba(239,68,68,0.5)' : '0 0 18px rgba(124,58,237,0.55)') : 'none',
                        background: '#05050E',
                        transform: i === activeImg ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      {isVideoUrl(src) ? (
                        <div className="absolute inset-0 flex items-center justify-center" style={{
                          background: i === activeImg ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.07)',
                        }}>
                          <Play style={{
                            width: '22px', height: '22px',
                            color: i === activeImg ? '#F87171' : '#4B5563',
                            fill: i === activeImg ? '#F87171' : '#4B5563',
                          }} />
                        </div>
                      ) : (
                        <Image
                          src={src} alt={`thumb-${i}`}
                          fill unoptimized
                          className="object-cover transition-all duration-300"
                          style={{
                            opacity: i === activeImg ? 1 : 0.4,
                            filter: i === activeImg ? 'none' : 'saturate(0.6)',
                          }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════
              META + TRUST BAR
          ═══════════════════════════════════════════ */}
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            {(product.developer || product.publisher || product.releaseDate || product.region) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="rounded-2xl overflow-hidden mb-5"
                style={{ background: 'rgba(8,8,18,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04]">
                  {[
                    product.developer && { label: 'Разработчик', value: product.developer },
                    product.publisher && product.publisher !== product.developer && { label: 'Издатель', value: product.publisher },
                    product.releaseDate && { label: 'Дата выхода', value: new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) },
                    product.region && { label: 'Регион', value: product.region },
                  ].filter(Boolean).slice(0, 4).map((item, i) => item && (
                    <div key={i} className="px-5 py-4">
                      <p className="font-pixel uppercase mb-1" style={{ fontSize: '8px', letterSpacing: '0.1em', color: '#374151' }}>{item.label}</p>
                      <p className="font-body" style={{ color: '#9CA3AF', fontSize: '13px' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            <TrustIndicators />
          </div>

          {/* ═══════════════════════════════════════════
              LOWER SECTIONS
          ═══════════════════════════════════════════ */}
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 pb-20">

            {product.editions && product.editions.length > 0 && (
              <EditionsSection editions={product.editions} currentEditionId={product.editions.find(e => e.isCurrentEdition)?.id} />
            )}

            {product.requirements && <SystemRequirements requirements={product.requirements} />}

            <ActivationGuide deliveryType={product.deliveryType} />

            {product.productReviews && product.productReviews.length > 0 && (
              <ProductReviews
                reviews={product.productReviews}
                overallRating={product.rating}
                totalReviews={product.reviews}
                productTitle={product.title}
              />
            )}

            <ProductFAQ faq={product.faq} />

            {/* Telegram CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden mb-12"
              style={{
                background: 'rgba(6,182,212,0.03)',
                border: '1px solid rgba(6,182,212,0.12)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 100% at 0% 50%, rgba(6,182,212,0.08) 0%, transparent 60%)',
              }} />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  boxShadow: '0 0 24px rgba(6,182,212,0.12)',
                }}>
                  <MessageCircle style={{ width: '24px', height: '24px', color: '#22D3EE' }} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
                    <span className="font-heading font-semibold text-green-400 text-xs tracking-wide">ОНЛАЙН · ПОДДЕРЖКА 24/7</span>
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-1">Нужна помощь с заказом?</h3>
                  <p className="font-body" style={{ color: '#6B7280', fontSize: '13px' }}>
                    Напишите нам в Telegram — отвечаем за&nbsp;5 минут.
                  </p>
                </div>
                <motion.a
                  href="https://t.me/arcaneuz_support" target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-2xl font-heading font-semibold text-white flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #06B6D4, #7C3AED)',
                    padding: '12px 24px', fontSize: '13px',
                    boxShadow: '0 0 30px rgba(6,182,212,0.3)',
                  }}
                >
                  <MessageCircle style={{ width: '15px', height: '15px' }} />
                  Написать в Telegram
                  <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.7 }} />
                </motion.a>
              </div>
            </motion.div>

            {/* Related products */}
            {related.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="font-pixel mb-1" style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.14em' }}>ПОХОЖИЕ ИГРЫ</p>
                    <h2 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(18px,3vw,24px)' }}>
                      Вам также может понравиться
                    </h2>
                  </div>
                  <Link href="/catalog" className="font-body hover:text-[#9D60FA] transition-colors hidden sm:block" style={{ color: '#374151', fontSize: '13px' }}>
                    Смотреть все →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
