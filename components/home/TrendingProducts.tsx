'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { trendingProducts } from '@/lib/mockData';

export default function TrendingProducts() {
  return (
    <section className="py-16 sm:py-20 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
              <p className="text-[#7C3AED] text-xs font-heading font-semibold tracking-widest uppercase">Популярное</p>
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">Топ продаж</h2>
          </div>
          <Link
            href="/catalog?sort=trending"
            className="text-sm text-gray-400 hover:text-[#9D60FA] transition-colors font-body hidden sm:block"
          >
            Смотреть все →
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-[#12121A] border border-[#1E1E2E] text-white text-sm font-heading font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:border-[#7C3AED]/50"
          >
            Смотреть все →
          </Link>
        </div>
      </div>
    </section>
  );
}
