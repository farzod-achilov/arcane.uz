'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShoppingCart, Heart, Check, Monitor, Gamepad2, Zap } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface StickyPurchasePanelProps {
  product: Product;
  buyButtonRef: React.RefObject<HTMLDivElement>;
}

export default function StickyPurchasePanel({ product, buyButtonRef }: StickyPurchasePanelProps) {
  const [visible, setVisible]       = useState(false);
  const [addedToCart, setAdded]     = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [platform, setPlatform]     = useState(product.platform[0]);

  const discount      = product.discount ?? 0;
  const originalPrice = product.originalPrice ?? product.price;

  useEffect(() => {
    if (!buyButtonRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(buyButtonRef.current);
    return () => observer.disconnect();
  }, [buyButtonRef]);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed bottom-0 left-0 right-0 z-[100]"
          style={{
            background: 'rgba(6,5,11,0.97)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(124,58,237,0.15)',
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 30%, rgba(6,182,212,0.4) 70%, transparent)' }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 py-3">
              {/* Game cover (desktop only) */}
              <div className="hidden sm:block relative w-12 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              {/* Game info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-heading font-bold text-white line-clamp-1"
                  style={{ fontSize: '14px' }}
                >
                  {product.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {/* Platform picker (compact) */}
                  <div className="flex gap-1">
                    {product.platform.slice(0, 3).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className="flex items-center gap-1 rounded-lg px-2 py-0.5 transition-all duration-150"
                        style={{
                          background: platform === p ? 'rgba(124,58,237,0.18)' : 'transparent',
                          border: `1px solid ${platform === p ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          fontSize: '10px',
                          color: platform === p ? '#C4B5FD' : '#4B5563',
                        }}
                      >
                        {p === 'PS5' || p === 'Xbox'
                          ? <Gamepad2 style={{ width: '9px', height: '9px' }} />
                          : <Monitor style={{ width: '9px', height: '9px' }} />}
                        <span className="font-body">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right hidden sm:block">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
                    {formatPrice(product.price)}
                  </span>
                  {discount > 0 && (
                    <span className="font-body line-through text-[#374151]" style={{ fontSize: '12px' }}>
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span
                      className="font-pixel rounded px-1.5 py-0.5"
                      style={{ fontSize: '7.5px', color: '#fff', background: '#EF4444' }}
                    >
                      -{discount}%
                    </span>
                    <span className="font-body text-green-400" style={{ fontSize: '10px' }}>
                      -{formatPrice(originalPrice - product.price)}
                    </span>
                  </div>
                )}
              </div>

              {/* Coins */}
              <div
                className="hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-1.5 flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}
              >
                <Zap style={{ width: '12px', height: '12px', color: '#9D60FA' }} />
                <span className="font-body text-[#9D60FA]" style={{ fontSize: '11px' }}>
                  +{Math.round(product.price / 1000)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Wishlist */}
                <motion.button
                  onClick={() => setWishlisted(v => !v)}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: wishlisted ? 'rgba(239,68,68,0.12)' : '#09090E',
                    border: `1px solid ${wishlisted ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    color: wishlisted ? '#F87171' : '#4B5563',
                    boxShadow: wishlisted ? '0 0 10px rgba(239,68,68,0.2)' : 'none',
                  }}
                >
                  <Heart style={{ width: '15px', height: '15px' }} className={wishlisted ? 'fill-current' : ''} />
                </motion.button>

                {/* Buy */}
                <motion.button
                  onClick={handleAdd}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl font-heading font-semibold text-white relative overflow-hidden"
                  style={{
                    background: addedToCart ? '#22C55E' : 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                    padding: '10px 20px',
                    fontSize: '13px',
                    letterSpacing: '0.025em',
                    boxShadow: addedToCart
                      ? '0 0 18px rgba(34,197,94,0.35)'
                      : '0 0 18px rgba(124,58,237,0.3)',
                    minWidth: '130px',
                    justifyContent: 'center',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span
                        key="ok"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check style={{ width: '14px', height: '14px' }} />
                        Добавлено!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="buy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart style={{ width: '14px', height: '14px' }} />
                        {product.preorder ? 'Предзаказать' : 'В корзину'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
