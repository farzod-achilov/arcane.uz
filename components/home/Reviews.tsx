'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, CheckCircle2 } from 'lucide-react';
import { reviews } from '@/lib/mockData';

export default function Reviews() {
  return (
    <section className="py-16 sm:py-20 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#7C3AED] text-xs font-heading font-semibold tracking-widest uppercase mb-2">Отзывы</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-3">
            Что говорят покупатели
          </h2>
          {/* Rating summary */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-heading font-bold text-2xl text-white">4.9</span>
            <span className="text-gray-500 font-body text-sm">из 50 000+ отзывов</span>
          </div>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group bg-[#12121A] border border-[#1E1E2E] hover:border-[#7C3AED]/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(124,58,237,0.1)]"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#1E1E2E]">
                    <Image
                      src={review.avatar}
                      alt={review.author}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-heading font-semibold text-sm">{review.author}</p>
                      {review.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-gray-600 text-[10px] font-body">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Text */}
              <p className="text-gray-400 font-body text-sm leading-relaxed mb-4">{review.text}</p>

              {/* Product tag */}
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#7C3AED]" />
                <span className="text-gray-600 text-xs font-body">Покупка: {review.productName}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
