'use client';

import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/hooks/useWishlist';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Props {
  gameId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function WishlistButton({ gameId, size = 'sm', className = '' }: Props) {
  const { isIn, toggle } = useWishlist();
  const { data: session } = useSession();
  const router = useRouter();
  const active = isIn(gameId);

  const dim = size === 'sm' ? { btn: 28, icon: 14 } : { btn: 36, icon: 18 };

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push('/login'); return; }
    toggle(gameId);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center rounded-full transition-all duration-200 ${className}`}
      style={{
        width:      dim.btn,
        height:     dim.btn,
        background: active ? 'rgba(239,68,68,0.18)' : 'rgba(0,0,0,0.55)',
        border:     `1px solid ${active ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.12)'}`,
        backdropFilter: 'blur(6px)',
      }}
      title={active ? 'Убрать из вишлиста' : 'В вишлист'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active ? 'filled' : 'empty'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          exit={{    scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            style={{ width: dim.icon, height: dim.icon }}
            className={active ? 'text-red-400 fill-red-400' : 'text-gray-400'}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
