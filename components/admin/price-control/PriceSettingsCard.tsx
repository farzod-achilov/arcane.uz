'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Props {
  title:       string;
  description?: string;
  icon:        LucideIcon;
  color:       string;
  children:    React.ReactNode;
  delay?:      number;
}

export default function PriceSettingsCard({
  title, description, icon: Icon, color, children, delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5 relative overflow-hidden group"
      style={{
        background: '#0D0D1A',
        border:     `1px solid rgba(255,255,255,0.06)`,
      }}
      whileHover={{ borderColor: `${color}22` }}
    >
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top right, ${color}0A, transparent 70%)` }}
      />
      {/* Top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${color}12`,
            border:     `1px solid ${color}25`,
            boxShadow:  `0 0 10px ${color}10`,
          }}
        >
          <Icon style={{ width: '15px', height: '15px', color }} />
        </div>
        <div>
          <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>{title}</p>
          {description && (
            <p className="font-body text-[#374151]" style={{ fontSize: '11px' }}>{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-10">{children}</div>
    </motion.div>
  );
}
