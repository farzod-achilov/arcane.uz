'use client';

import { motion } from 'framer-motion';
import { Check, Star, ShoppingCart } from 'lucide-react';
import type { GameEdition } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface EditionsSectionProps {
  editions: GameEdition[];
  currentEditionId?: string;
}

export default function EditionsSection({ editions, currentEditionId }: EditionsSectionProps) {
  if (!editions || editions.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
        <div className="flex items-center gap-2">
          <p
            className="font-pixel"
            style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.14em' }}
          >
            ИЗДАНИЯ
          </p>
        </div>
        <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
      </div>
      <h2 className="font-heading font-bold text-white text-xl sm:text-2xl mb-6">
        Выберите издание
      </h2>

      <div className={`grid gap-4 ${editions.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        {editions.map((edition, i) => {
          const isActive = edition.isCurrentEdition || edition.id === currentEditionId;
          const accentColor = edition.color ?? '#7C3AED';
          return (
            <motion.div
              key={edition.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: isActive ? `${accentColor}08` : '#0D0D16',
                border: `1px solid ${isActive ? `${accentColor}35` : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isActive ? `0 0 24px ${accentColor}14` : 'none',
              }}
            >
              {/* Top line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, transparent, ${accentColor}70, transparent)`
                    : 'transparent',
                }}
              />

              {/* Recommended badge */}
              {edition.badge && (
                <div className="absolute top-3 right-3 z-10">
                  <div
                    className="flex items-center gap-1 rounded-lg px-2 py-1"
                    style={{
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}35`,
                    }}
                  >
                    <Star style={{ width: '9px', height: '9px', color: accentColor }} />
                    <span className="font-pixel" style={{ fontSize: '6px', color: accentColor, letterSpacing: '0.06em' }}>
                      {edition.badge}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                {/* Edition title */}
                <p className="font-heading font-bold text-white mb-1" style={{ fontSize: '15px' }}>
                  {edition.title}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span
                    className="font-heading font-bold"
                    style={{ fontSize: '22px', color: isActive ? accentColor : '#E2E8F0' }}
                  >
                    {formatPrice(edition.price)}
                  </span>
                  {edition.originalPrice && edition.originalPrice > edition.price && (
                    <span className="font-body line-through text-[#374151]" style={{ fontSize: '13px' }}>
                      {formatPrice(edition.originalPrice)}
                    </span>
                  )}
                  {edition.discount && edition.discount > 0 && (
                    <span
                      className="font-pixel rounded px-1.5 py-0.5"
                      style={{
                        fontSize: '8px',
                        color: '#fff',
                        background: '#EF4444',
                        letterSpacing: '0.04em',
                      }}
                    >
                      -{edition.discount}%
                    </span>
                  )}
                </div>

                {/* Includes list */}
                <ul className="space-y-2 mb-5 flex-1">
                  {edition.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: isActive ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isActive ? `${accentColor}35` : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <Check
                          style={{
                            width: '9px', height: '9px',
                            color: isActive ? accentColor : '#4B5563',
                          }}
                        />
                      </div>
                      <span className="font-body text-[#9CA3AF]" style={{ fontSize: '12.5px' }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <div
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-heading font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                      fontSize: '13px',
                      boxShadow: `0 0 16px ${accentColor}30`,
                    }}
                  >
                    <Check style={{ width: '14px', height: '14px' }} />
                    Текущее издание
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-heading font-semibold transition-all duration-200"
                    style={{
                      background: '#09090E',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '13px',
                      color: '#6B7280',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}40`;
                      (e.currentTarget as HTMLElement).style.color = accentColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#6B7280';
                    }}
                  >
                    <ShoppingCart style={{ width: '13px', height: '13px' }} />
                    Выбрать
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
