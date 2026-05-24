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

/* ── Video URL detection ───────────────────────────────── */
function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
    || url.includes('video.cloudflare.steamstatic.com')
    || url.includes('youtube.com/embed');
}
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/embed');
}

/* ── Badge config ──────────────────────────────────────── */
const BADGE_CFG: Record<string, { bg: string; label: string; glow: string }> = {
  hot:      { bg: 'linear-gradient(135deg, #EF4444, #F97316)', label: 'HOT',       glow: 'rgba(239,68,68,0.5)' },
  new:      { bg: 'linear-gradient(135deg, #06B6D4, #7C3AED)', label: 'NEW',       glow: 'rgba(6,182,212,0.5)' },
  sale:     { bg: '#EF4444',                                     label: 'SALE',      glow: 'rgba(239,68,68,0.5)' },
  exclusive:{ bg: 'linear-gradient(135deg, #7C3AED, #06B6D4)', label: 'EXCL',      glow: 'rgba(124,58,237,0.5)' },
  preorder: { bg: 'linear-gradient(135deg, #F59E0B, #EF4444)',  label: 'PRE-ORDER', glow: 'rgba(245,158,11,0.5)' },
};


/* ── Product Meta bar ──────────────────────────────────── */
function ProductMetaBar({ product }: { product: NonNullable<ReturnType<typeof products.find>> }) {
  const metaItems = [
    product.developer && { label: 'Разработчик', value: product.developer, icon: Cpu },
    product.publisher && product.publisher !== product.developer && { label: 'Издатель', value: product.publisher, icon: Cpu },
    product.releaseDate && {
      label: 'Релиз',
      value: new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }),
      icon: Calendar,
    },
    product.region && { label: 'Регион', value: product.region, icon: Globe },
    product.singleplayer !== undefined && {
      label: 'Режим',
      value: product.multiplayer && product.singleplayer ? 'Одиночный + Мультиплеер' : product.multiplayer ? 'Мультиплеер' : 'Одиночная игра',
      icon: product.multiplayer ? Users : PlaySquare,
    },
    product.controllerSupport && { label: 'Геймпад', value: 'Поддерживается', icon: Gamepad },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType }[];

  if (metaItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl overflow-hidden mb-5"
      style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-white/[0.05]">
        {metaItems.slice(0, 6).map((item, i) => (
          <div
            key={item.label}
            className="px-4 py-3"
            style={{ borderBottom: i < metaItems.length - 3 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <item.icon style={{ width: '10px', height: '10px', color: '#374151' }} />
              <p className="font-body text-[#374151] uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
                {item.label}
              </p>
            </div>
            <p className="font-body text-[#9CA3AF]" style={{ fontSize: '12px' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
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

  // Fetch from arcane-api / PostgreSQL when not in mock data
  useEffect(() => {
    if (mockProduct) return;
    fetch(`/api/arcane/games/${params.id}`)
      .then(r => r.json())
      .then((res: ArcaneGameResponse) => {
        if (res.success && res.data) {
          const p = arcaneGameToProduct(res.data);
          setProduct(p);
          setPlatform(p.platform[0] ?? '');
        } else {
          setNotFoundErr(true);
        }
      })
      .catch(() => setNotFoundErr(true))
      .finally(() => setLoading(false));
  }, [params.id, mockProduct]);

  // All hooks must be called before any early returns (Rules of Hooks)
  // Trailer (if any) is inserted after the cover, before screenshots
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7C3AED', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const discount      = product.discount ?? 0;
  const originalPrice = product.originalPrice ?? product.price;

  const prevImg = () => setActiveImg(i => (i === 0 ? allScreenshots.length - 1 : i - 1));
  const nextImg = () => setActiveImg(i => (i === allScreenshots.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Fullscreen Gallery — images only, no video */}
      <AnimatePresence>
        {fullscreen && (
          <FullscreenGallery
            images={allScreenshots.filter(s => !isVideoUrl(s))}
            startIndex={allScreenshots.slice(0, activeImg + 1).filter(s => !isVideoUrl(s)).length - 1}
            onClose={closeFullscreen}
          />
        )}
      </AnimatePresence>

      {/* Sticky Purchase Panel */}
      <StickyPurchasePanel product={product} buyButtonRef={buyButtonRef} />

      <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '108px' }}>
        {/* Ambient bg */}
        <div
          className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.07) 0%, transparent 70%)' }}
        />

        {/* Breadcrumb */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-body" style={{ color: '#4B5563' }}>
              <Link href="/" className="hover:text-gray-400 transition-colors">Главная</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/catalog" className="hover:text-gray-400 transition-colors">Каталог</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-400 line-clamp-1">{product.title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

          {/* ── HERO: Gallery + Details ── */}
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 mb-10">

            {/* ── Left: Gallery ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main image / video */}
              <div
                className="group relative aspect-video max-w-lg mx-auto lg:mx-0 rounded-3xl overflow-hidden"
                style={{
                  boxShadow: '0 0 60px rgba(124,58,237,0.2), 0 40px 80px rgba(0,0,0,0.6)',
                  background: '#070710',
                  cursor: isVideoUrl(allScreenshots[activeImg]) ? 'default' : 'zoom-in',
                }}
                onClick={() => { if (!isVideoUrl(allScreenshots[activeImg])) openFullscreen(); }}
              >
                <AnimatePresence mode="wait">
                  {isYouTubeUrl(allScreenshots[activeImg]) ? (
                    <motion.div
                      key={`yt-${activeImg}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <iframe
                        src={allScreenshots[activeImg]}
                        className="absolute inset-0 w-full h-full"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        style={{ border: 'none' }}
                      />
                    </motion.div>
                  ) : isVideoUrl(allScreenshots[activeImg]) ? (
                    <motion.div
                      key={`v-${activeImg}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <video
                        src={allScreenshots[activeImg]}
                        autoPlay loop muted playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeImg}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={allScreenshots[activeImg]}
                        alt={`${product.title} screenshot ${activeImg + 1}`}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                        priority={activeImg === 0}
                        unoptimized
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(10,10,15,0.6) 0%, transparent 50%)' }}
                />

                {/* TRAILER badge */}
                {isVideoUrl(allScreenshots[activeImg]) && (
                  <div
                    className="absolute top-4 left-4 font-pixel text-white rounded-xl pointer-events-none flex items-center gap-1.5"
                    style={{ fontSize: '9px', padding: '5px 10px', background: 'linear-gradient(135deg,#EF4444,#F97316)', letterSpacing: '0.06em', boxShadow: '0 0 16px rgba(239,68,68,0.5)' }}
                  >
                    ▶ TRAILER
                  </div>
                )}

                {/* Badge */}
                {!isVideoUrl(allScreenshots[activeImg]) && product.badge && BADGE_CFG[product.badge] && (
                  <div
                    className="absolute top-4 left-4 font-pixel text-white rounded-xl pointer-events-none"
                    style={{
                      fontSize: '9px', padding: '5px 10px',
                      background: BADGE_CFG[product.badge].bg,
                      letterSpacing: '0.06em',
                      boxShadow: `0 0 16px ${BADGE_CFG[product.badge].glow}`,
                    }}
                  >
                    {BADGE_CFG[product.badge].label}
                  </div>
                )}

                {/* Discount badge */}
                {discount > 0 && (
                  <div
                    className="absolute top-4 right-4 font-heading font-bold text-white rounded-xl pointer-events-none"
                    style={{ fontSize: '14px', padding: '4px 10px', background: '#EF4444', boxShadow: '0 0 16px rgba(239,68,68,0.5)' }}
                  >
                    -{discount}%
                  </div>
                )}

                {/* Fullscreen icon — only for images */}
                {!isVideoUrl(allScreenshots[activeImg]) && (
                  <div
                    className="absolute bottom-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* Arrows */}
                {allScreenshots.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); prevImg(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.6)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.6)'; }}
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImg(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.6)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.6)'; }}
                    >
                      <ChevronRightIcon className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}

                {/* Dots */}
                {allScreenshots.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
                    {allScreenshots.map((_, i) => (
                      <div
                        key={i}
                        className="transition-all duration-200 rounded-full"
                        style={{
                          width: i === activeImg ? '20px' : '6px', height: '6px',
                          background: i === activeImg ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : 'rgba(255,255,255,0.25)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allScreenshots.length > 1 && (
                <div className="flex gap-2 mt-3 max-w-lg mx-auto lg:mx-0 overflow-x-auto pb-1">
                  {allScreenshots.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className="flex-shrink-0 relative w-20 h-14 rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        border: `2px solid ${i === activeImg ? (isVideoUrl(src) ? '#EF4444' : '#7C3AED') : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: i === activeImg ? (isVideoUrl(src) ? '0 0 12px rgba(239,68,68,0.4)' : '0 0 12px rgba(124,58,237,0.4)') : 'none',
                      }}
                    >
                      {isVideoUrl(src) ? (
                        <div className="absolute inset-0 flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(249,115,22,0.25))' }}>
                          <span style={{ fontSize: '18px', opacity: i === activeImg ? 1 : 0.55 }}>▶</span>
                        </div>
                      ) : (
                        <Image
                          src={src}
                          alt={`thumb-${i}`}
                          fill unoptimized
                          className="object-cover transition-opacity duration-200"
                          style={{ opacity: i === activeImg ? 1 : 0.55 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Right: Details ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col"
            >
              {/* Category + share + developer */}
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={`/catalog?category=${product.category}`}
                  className="text-xs px-3 py-1 rounded-full font-body transition-colors capitalize"
                  style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  {product.category}
                </Link>
                <div className="flex items-center gap-1.5">
                  {product.developer && (
                    <span className="font-body text-[#374151] text-xs">{product.developer}</span>
                  )}
                  <button className="p-2 text-gray-500 hover:text-white hover:bg-[#12121A] rounded-lg transition-all duration-200">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-1">{product.title}</h1>
              <p className="text-gray-500 font-body text-base mb-4">{product.subtitle}</p>

              {/* Rating + release date */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                    />
                  ))}
                  <span className="text-white font-heading font-semibold ml-1">{product.rating}</span>
                </div>
                <span className="text-gray-500 text-sm font-body">({product.reviews.toLocaleString()} отзывов)</span>
                {product.releaseDate && (
                  <div className="flex items-center gap-1 text-xs font-body" style={{ color: '#4B5563' }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Genres */}
              {product.genres && product.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.genres.map(g => (
                    <span
                      key={g}
                      className="font-body rounded-lg px-2 py-1"
                      style={{ fontSize: '11px', color: '#4B5563', background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-gray-400 font-body text-sm leading-relaxed mb-5">{product.description}</p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {product.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(124,58,237,0.2)' }}
                    >
                      <Check className="w-2.5 h-2.5 text-[#9D60FA]" />
                    </div>
                    <span className="text-gray-300 font-body">{f}</span>
                  </div>
                ))}
              </div>

              {/* Platform selector */}
              <div className="mb-5">
                <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">Платформа / Магазин</p>
                <div className="flex flex-wrap gap-2">
                  {product.platform.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-all duration-200"
                      style={{
                        background: selectedPlatform === p ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : '#12121A',
                        border: `1px solid ${selectedPlatform === p ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                        color: selectedPlatform === p ? '#fff' : '#6B7280',
                        boxShadow: selectedPlatform === p ? '0 0 15px rgba(124,58,237,0.4)' : 'none',
                      }}
                    >
                      {['PC','Steam','Epic Games','EA App','Ubisoft Connect'].includes(p)
                        ? <Monitor className="w-3.5 h-3.5" />
                        : <Gamepad2 className="w-3.5 h-3.5" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preorder notice */}
              {product.preorder && product.releaseDate && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3.5 mb-4"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}
                >
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-semibold text-amber-400 text-sm">Предзаказ</p>
                    <p className="font-body text-[#9CA3AF] text-xs">
                      Выход: {new Date(product.releaseDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Price box — ref for sticky panel trigger */}
              <div ref={buyButtonRef}>
                <div
                  className="rounded-2xl p-5 mb-5"
                  style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-gray-500 text-xs font-body mb-1">Цена для {selectedPlatform}</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-heading font-bold text-3xl text-white">{formatPrice(product.price)}</span>
                        {discount > 0 && (
                          <span className="text-gray-600 text-base line-through font-body">{formatPrice(originalPrice)}</span>
                        )}
                      </div>
                      {discount > 0 && (
                        <p className="text-green-400 text-sm font-body mt-1">
                          Экономия: {formatPrice(originalPrice - product.price)}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
                    >
                      <Zap className="w-3.5 h-3.5 text-[#9D60FA]" />
                      <span className="text-[#9D60FA] text-xs font-heading font-semibold">
                        +{Math.round(product.price / 1000)} монет
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleAddToCart}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading font-semibold text-sm transition-all duration-300"
                      style={{
                        background: addedToCart ? '#22C55E' : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                        color: '#fff',
                        boxShadow: addedToCart ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(124,58,237,0.3)',
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {addedToCart ? (
                          <motion.span key="added" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                            <Check className="w-4 h-4" /> Добавлено!
                          </motion.span>
                        ) : (
                          <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            {product.preorder ? 'Предзаказать' : 'В корзину'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <motion.button
                      onClick={() => setWishlisted(v => !v)}
                      whileTap={{ scale: 0.93 }}
                      className="p-3.5 rounded-xl transition-all duration-200"
                      style={{
                        background: wishlisted ? 'rgba(239,68,68,0.12)' : '#0A0A0F',
                        border: `1px solid ${wishlisted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        color: wishlisted ? '#F87171' : '#6B7280',
                        boxShadow: wishlisted ? '0 0 12px rgba(239,68,68,0.2)' : 'none',
                      }}
                    >
                      <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Trust mini badges */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: Shield, text: 'Гарантия подлинности' },
                  { icon: Globe,  text: 'Регион RU/CIS' },
                  { icon: Check,  text: 'Проверено вручную' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center gap-1.5 rounded-xl p-3"
                    style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <item.icon className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-gray-500 text-[10px] font-body leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Delivery */}
              <div className="mb-5">
                <p className="font-heading font-semibold text-[#4B5563] mb-2.5 uppercase tracking-wider" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
                  Способ доставки
                </p>
                <DeliveryInfoCard
                  deliveryType={product.deliveryType}
                  deliveryTime={product.deliveryTime}
                  deliveryDescription={product.deliveryDescription}
                  variant="full"
                  animated
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-body"
                    style={{ color: '#6B7280', background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Product Meta bar ── */}
          {(product.developer || product.publisher || product.region || product.genres) && (
            <ProductMetaBar product={product} />
          )}

          {/* ── Trust Indicators ── */}
          <TrustIndicators />

          {/* ── LOWER SECTIONS ── */}
          <div className="mt-4">

            {/* Editions */}
            {product.editions && product.editions.length > 0 && (
              <EditionsSection
                editions={product.editions}
                currentEditionId={product.editions.find(e => e.isCurrentEdition)?.id}
              />
            )}

            {/* System Requirements */}
            {product.requirements && (
              <SystemRequirements requirements={product.requirements} />
            )}

            {/* Activation Guide */}
            <ActivationGuide deliveryType={product.deliveryType} />

            {/* Reviews */}
            {product.productReviews && product.productReviews.length > 0 && (
              <ProductReviews
                reviews={product.productReviews}
                overallRating={product.rating}
                totalReviews={product.reviews}
                productTitle={product.title}
              />
            )}

            {/* FAQ */}
            <ProductFAQ faq={product.faq} />

            {/* Telegram CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="relative rounded-2xl overflow-hidden mb-12"
              style={{ border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.07) 0%, rgba(124,58,237,0.05) 50%, rgba(10,10,15,0.95) 100%)' }} />
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.015 }} />
              <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(6,182,212,0.12) 0%, transparent 65%)' }} />

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 24px rgba(6,182,212,0.15)' }}>
                  <MessageCircle className="w-7 h-7 text-[#22D3EE]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
                    <span className="font-heading font-semibold text-green-400 text-xs tracking-wide">ОНЛАЙН · ПОДДЕРЖКА</span>
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-1.5">Нужна помощь с заказом?</h3>
                  <p className="font-body text-[#6B7280] text-sm leading-relaxed">
                    Напишите нам в Telegram — отвечаем за&nbsp;5 минут, 24/7.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    {[
                      { icon: Clock, text: '< 5 мин ответ' },
                      { icon: Shield, text: 'Безопасная оплата' },
                      { icon: Globe, text: 'RU / UZ поддержка' },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs font-body" style={{ color: '#4B5563' }}>
                        <b.icon className="w-3 h-3 text-[#06B6D4]" />
                        {b.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <motion.a
                    href="https://t.me/arcaneuz_support" target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 rounded-xl font-heading font-semibold text-white relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)', padding: '12px 24px', fontSize: '13.5px', boxShadow: '0 0 24px rgba(6,182,212,0.35)', letterSpacing: '0.03em' }}
                  >
                    <MessageCircle className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Написать в Telegram</span>
                    <ExternalLink className="w-3.5 h-3.5 relative z-10 opacity-70" />
                  </motion.a>
                  <p className="font-body text-[#374151] text-xs">@arcaneuz_support</p>
                </div>
              </div>
            </motion.div>

            {/* Related products */}
            {related.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="font-pixel mb-1" style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.14em' }}>ПОХОЖИЕ</p>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">Вам также может понравиться</h2>
                  </div>
                  <Link href="/catalog" className="text-sm text-gray-400 hover:text-[#9D60FA] transition-colors font-body hidden sm:block">
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
