'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Quest {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  reward:      number;
  completed:   boolean;
}

interface QuestData {
  quests:       Quest[];
  totalReward:  number;
  maxReward:    number;
  completedCnt: number;
  total:        number;
}

export default function DailyQuestsWidget() {
  const [data,    setData]    = useState<QuestData | null>(null);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/quests/daily');
      if (!res.ok) return;
      const d = await res.json() as QuestData;
      setData(d);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data || data.quests.length === 0) return null;

  const pct = Math.round((data.completedCnt / data.total) * 100);
  const allDone = data.completedCnt === data.total;

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: '#0D0D16', border: `1px solid ${allDone ? 'rgba(34,197,94,0.25)' : 'rgba(124,58,237,0.2)'}` }}>

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: allDone ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.15)',
                        border: `1px solid ${allDone ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
            <span style={{ fontSize: '16px' }}>🎯</span>
          </div>
          <div className="text-left">
            <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>
              Дневные задания
            </p>
            <p className="font-body" style={{ fontSize: '11px', color: allDone ? '#4ADE80' : '#6B7280' }}>
              {allDone ? '✓ Все выполнены!' : `${data.completedCnt}/${data.total} · +${data.maxReward - data.totalReward} ARC осталось`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress circle */}
          <div className="relative w-9 h-9">
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none"
                      stroke={allDone ? '#4ADE80' : '#7C3AED'} strokeWidth="3"
                      strokeDasharray={`${pct * 0.88} 88`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-pixel"
                  style={{ fontSize: '8px', color: allDone ? '#4ADE80' : '#C4B5FD' }}>
              {pct}%
            </span>
          </div>
          {open ? <ChevronUp style={{ width: '14px', height: '14px', color: '#4B5563' }} />
                : <ChevronDown style={{ width: '14px', height: '14px', color: '#4B5563' }} />}
        </div>
      </button>

      {/* Progress bar */}
      <div className="mx-5 mb-1">
        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div className="h-full rounded-full"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ background: allDone
                        ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                        : 'linear-gradient(90deg, #7C3AED, #9D60FA)' }} />
        </div>
      </div>

      {/* Quest list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-2"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {data.quests.map(q => (
                <div key={q.id}
                     className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                     style={{
                       background: q.completed ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.025)',
                       border: `1px solid ${q.completed ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}`,
                     }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{q.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold"
                       style={{ fontSize: '12.5px', color: q.completed ? '#4ADE80' : '#E5E7EB' }}>
                      {q.title}
                    </p>
                    <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                      {q.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {q.completed ? (
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#4ADE80' }} />
                    ) : (
                      <span className="font-pixel rounded-full px-2 py-0.5"
                            style={{ fontSize: '8px', background: 'rgba(124,58,237,0.15)',
                                     color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.25)' }}>
                        +{q.reward} ARC
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                  Обновятся в полночь
                </span>
                <div className="flex items-center gap-1">
                  <Zap style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
                  <span className="font-heading font-bold text-[#FCD34D]" style={{ fontSize: '12px' }}>
                    +{data.totalReward} / {data.maxReward} ARC
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
