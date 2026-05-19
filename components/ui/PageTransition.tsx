'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  /** Delay before entering (seconds). Default 0 */
  delay?: number;
}

/**
 * Wrap any page or section content to apply the standard
 * ARCANE page-entrance animation (fade + subtle rise).
 *
 * Usage in each page:
 *   <PageTransition>
 *     <YourPageContent />
 *   </PageTransition>
 */
export default function PageTransition({ children, delay = 0 }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.38,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Cinematic section reveal ─────────────────────────── */
interface SectionRevealProps {
  children: ReactNode;
  /** Pixel offset to start from. Default 20 */
  offset?: number;
  delay?: number;
  className?: string;
}

export function SectionReveal({ children, offset = 20, delay = 0, className = '' }: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Staggered children reveal ───────────────────────── */
const staggerParent = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
}

export function StaggerReveal({ children, className = '' }: StaggerRevealProps) {
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
