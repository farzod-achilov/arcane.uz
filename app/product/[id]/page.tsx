'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star, ShoppingCart, Heart, Share2, ChevronRight,
  Check, Globe, Monitor, Gamepad2, Tag, Shield, Zap
} from 'lucide-react';
import { products } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/ui/ProductCard';

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) notFound();

  const [selectedPlatform, setSelectedPlatform] = useState(product.platform[0]);
  const [addedToCart, setAddedToCart] = useState(false);

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const discount = product.discount ?? 0;
  const originalPrice = product.originalPrice ?? product.price;

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-[108px]">
      {/* Breadcrumb */}
      <div className="border-b border-[#1E1E2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-body text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition-colors">Главная</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/catalog" className="hover:text-gray-400 transition-colors">Каталог</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-400 line-clamp-1">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Main product section */}
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 mb-16">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-[3/4] max-w-lg mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(124,58,237,0.2)]">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/50 via-transparent to-transparent" />

              {/* Badge */}
              {product.badge && (
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-xs font-heading font-bold tracking-wider ${
                  product.badge === 'hot' ? 'bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white' :
                  product.badge === 'new' ? 'bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] text-white' :
                  product.badge === 'sale' ? 'bg-[#EF4444] text-white' :
                  'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white'
                }`}>
                  {product.badge.toUpperCase()}
                </div>
              )}
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-[#EF4444] text-white px-3 py-1 rounded-xl text-sm font-heading font-bold">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Thumbnails placeholder */}
            <div className="flex gap-3 mt-4 max-w-lg mx-auto lg:mx-0">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex-1 aspect-video rounded-xl overflow-hidden border border-[#1E1E2E] hover:border-[#7C3AED]/40 cursor-pointer transition-colors">
                  <Image
                    src={`${product.image}?v=${n}`}
                    alt={`Screenshot ${n}`}
                    width={200}
                    height={112}
                    className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {/* Category + share */}
            <div className="flex items-center justify-between mb-3">
              <Link
                href={`/catalog?category=${product.category}`}
                className="text-xs text-[#7C3AED] bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-1 rounded-full font-body hover:bg-[#7C3AED]/20 transition-colors capitalize"
              >
                {product.category}
              </Link>
              <button className="p-2 text-gray-500 hover:text-white hover:bg-[#12121A] rounded-lg transition-all duration-200">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-1">{product.title}</h1>
            <p className="text-gray-500 font-body text-base mb-4">{product.subtitle}</p>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                  />
                ))}
              </div>
              <span className="text-white font-heading font-semibold">{product.rating}</span>
              <span className="text-gray-500 text-sm font-body">({product.reviews.toLocaleString()} отзывов)</span>
            </div>

            {/* Description */}
            <p className="text-gray-400 font-body text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {product.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-[#7C3AED]/20 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-[#9D60FA]" />
                  </div>
                  <span className="text-gray-300 font-body">{f}</span>
                </div>
              ))}
            </div>

            {/* Platform selector */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 font-body uppercase tracking-wider mb-3">Платформа</p>
              <div className="flex flex-wrap gap-2">
                {product.platform.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-all duration-200 ${
                      selectedPlatform === p
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                        : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#7C3AED]/40 hover:text-white'
                    }`}
                  >
                    {p === 'PC' ? <Monitor className="w-3.5 h-3.5" /> : <Gamepad2 className="w-3.5 h-3.5" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-5 mb-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-gray-500 text-xs font-body mb-1">Цена для {selectedPlatform}</p>
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading font-bold text-3xl text-white">
                      {formatPrice(product.price)}
                    </span>
                    {discount > 0 && (
                      <span className="text-gray-600 text-base line-through font-body">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  {discount > 0 && (
                    <p className="text-green-400 text-sm font-body mt-1">
                      Экономия: {formatPrice(originalPrice - product.price)}
                    </p>
                  )}
                </div>
                {/* Arcane coins earn */}
                <div className="flex items-center gap-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-1.5 rounded-xl">
                  <Zap className="w-3.5 h-3.5 text-[#9D60FA]" />
                  <span className="text-[#9D60FA] text-xs font-heading font-semibold">
                    +{Math.round(product.price / 1000)} монет
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading font-semibold text-sm transition-all duration-300 ${
                    addedToCart
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:scale-[1.02]'
                  }`}
                >
                  {addedToCart ? (
                    <><Check className="w-4 h-4" /> Добавлено!</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> В корзину</>
                  )}
                </motion.button>
                <button className="p-3.5 bg-[#0A0A0F] border border-[#1E1E2E] hover:border-red-500/30 hover:text-red-400 rounded-xl text-gray-500 transition-all duration-200">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap, text: 'Мгновенная доставка ключа' },
                { icon: Shield, text: 'Гарантия подлинности' },
                { icon: Globe, text: 'Официальная лицензия' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1.5 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-3">
                  <item.icon className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-gray-500 text-[10px] font-body leading-tight">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-600 bg-[#12121A] border border-[#1E1E2E] px-2 py-1 rounded-lg font-body">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[#7C3AED] text-xs font-heading font-semibold tracking-widest uppercase mb-1">Похожие</p>
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">Вам также может понравиться</h2>
              </div>
              <Link href="/catalog" className="text-sm text-gray-400 hover:text-[#9D60FA] transition-colors font-body hidden sm:block">
                Смотреть все →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
