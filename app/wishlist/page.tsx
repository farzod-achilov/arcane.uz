'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/lib/userContext';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';

export default function WishlistPage() {
  const { isLoggedIn, wishlist, removeFromWishlist } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="font-heading font-semibold text-[#EF4444] mb-1"
               style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
              Мой вишлист
            </p>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>
              Список желаний{' '}
              {wishlistProducts.length > 0 && (
                <span className="font-pixel text-[#4B5563]" style={{ fontSize: '12px' }}>
                  ({wishlistProducts.length})
                </span>
              )}
            </h1>
          </div>
          {wishlistProducts.length > 0 && (
            <Link href="/catalog" className="font-body text-[#4B5563] hover:text-[#9D60FA] transition-colors flex items-center gap-1"
                  style={{ fontSize: '13px' }}>
              Каталог <ArrowRight style={{ width: '13px', height: '13px' }} />
            </Link>
          )}
        </motion.div>

        {wishlistProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="mx-auto mb-4 text-[#1F2937]" style={{ width: '48px', height: '48px' }} />
            <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
              Вишлист пуст
            </h2>
            <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '14px' }}>
              Добавляйте игры в вишлист, чтобы следить за ценами
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                padding: '12px 24px',
                fontSize: '14px',
                boxShadow: '0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)',
              }}
            >
              Перейти в каталог
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.06 }}
                className="group rounded-2xl overflow-hidden"
                style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                {/* Image */}
                <Link href={`/product/${product.id}`} className="block relative aspect-[16/9] overflow-hidden">
                  <Image src={product.image} alt={product.title} fill unoptimized
                    className="object-cover transition-transform duration-400 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0"
                       style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,22,0.8) 100%)' }} />
                  {product.discount && (
                    <div className="absolute top-2.5 right-2.5 font-pixel rounded"
                         style={{ fontSize: '7.5px', background: '#EF4444', color: '#fff',
                                  padding: '2.5px 6px', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                      -{product.discount}%
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-heading font-semibold text-white line-clamp-1 mb-1 hover:text-[#C4B5FD] transition-colors"
                        style={{ fontSize: '14px' }}>
                      {product.title}
                    </h3>
                  </Link>
                  <p className="font-body text-[#374151] mb-3" style={{ fontSize: '11.5px' }}>
                    {product.platform.slice(0, 2).join(' · ')} · RU/CIS
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="font-body line-through text-[#374151] ml-2" style={{ fontSize: '11px' }}>
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Cart */}
                      <Link
                        href="/checkout"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                 boxShadow: '0 0 0 1px rgba(124,58,237,0.35)' }}
                      >
                        <ShoppingCart style={{ width: '13px', height: '13px' }} />
                      </Link>
                      {/* Remove */}
                      <button
                        onClick={() => removeFromWishlist(product.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 text-[#4B5563] hover:text-[#F87171] hover:bg-red-400/10"
                        style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Instant delivery */}
                  {product.inStock && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <Zap style={{ width: '10px', height: '10px', color: '#22C55E' }} />
                      <span className="font-body text-[#22C55E]" style={{ fontSize: '10.5px' }}>
                        Мгновенная доставка
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
