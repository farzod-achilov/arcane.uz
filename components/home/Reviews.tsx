'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, CheckCircle2 } from 'lucide-react';

export type ReviewItem = {
  id:        string;
  rating:    number;
  body:      string;
  author:    string;
  avatar:    string | null;
  gameTitle: string;
  verified:  boolean;
  createdAt: string;
};

export default function Reviews({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <section className="py-16 sm:py-20 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-heading font-bold text-2xl text-white">
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <span className="text-gray-500 font-body text-sm">{reviews.length} отзывов</span>
          </div>
        </motion.div>

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
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#1E1E2E] flex-shrink-0"
                       style={{ background: 'rgba(124,58,237,0.15)' }}>
                    {review.avatar ? (
                      <Image src={review.avatar} alt={review.author} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-heading font-bold text-[#7C3AED]"
                           style={{ fontSize: '14px' }}>
                        {review.author[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-heading font-semibold text-sm">{review.author}</p>
                      {review.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4]" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-gray-600 text-[10px] font-body">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                  ))}
                </div>
              </div>

              <p className="text-gray-400 font-body text-sm leading-relaxed mb-4 line-clamp-3">{review.body}</p>

              {review.gameTitle && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#7C3AED]" />
                  <span className="text-gray-600 text-xs font-body">Покупка: {review.gameTitle}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
