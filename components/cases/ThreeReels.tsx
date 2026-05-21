'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { CaseReward, RARITY_META, pickWeightedReward, rarityRank } from '@/lib/casesData';
import { cn } from '@/lib/utils';

// ── Layout ────────────────────────────────────────────────────────────────────
export const CARD_W   = 96;
export const CARD_H   = 112;
export const CARD_GAP = 8;
export const STRIDE   = CARD_H + CARD_GAP;          // 120
const VISIBLE         = 5;
const CONTAINER_H     = VISIBLE * STRIDE - CARD_GAP; // 592
const WINNER_IDX      = 22;
const TRACK_LEN       = 30;
// winner_center = 22*120+56=2696 | container_center=296 → targetY=−2400
const TARGET_Y = -(WINNER_IDX * STRIDE + CARD_H / 2 - CONTAINER_H / 2);

const STOP_MS  = [3000, 4400, 5700];
const STOP_DUR = STOP_MS.map(ms => ms / 1000);

// ── Types ─────────────────────────────────────────────────────────────────────
type MatchType   = 'triple' | 'double' | 'reroll'; // reroll = all different
type RerollState = 'none' | 'selecting' | 'spinning' | 'done';

// ── Build tracks ──────────────────────────────────────────────────────────────
function buildTracks(rewards: CaseReward[], result: CaseReward): CaseReward[][] {
  const rank = rarityRank(result.rarity);

  function makeTrack(matchResult: boolean): CaseReward[] {
    const t = Array.from({ length: TRACK_LEN }, () => pickWeightedReward(rewards));
    t[WINNER_IDX] = matchResult ? result : pickWeightedReward(rewards);
    if (matchResult && Math.random() < 0.25) {
      const higher = rewards.filter(r => rarityRank(r.rarity) > rank);
      if (higher.length) t[WINNER_IDX - 1] = higher[Math.floor(Math.random() * higher.length)];
    }
    return t;
  }

  if (rank >= 3) return [makeTrack(true), makeTrack(true), makeTrack(true)];
  if (rank === 2) return [makeTrack(true), makeTrack(false), makeTrack(true)];
  // For rare/common → all 3 are different (triggers reroll)
  return [makeTrack(true), makeTrack(false), makeTrack(false)];
}

// ── Reward card ───────────────────────────────────────────────────────────────
function ReelCard({ reward, lit }: { reward: CaseReward; lit: boolean }) {
  const meta = RARITY_META[reward.rarity];
  return (
    <motion.div
      className={cn(
        'flex-shrink-0 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5',
        'relative overflow-hidden select-none',
        meta.border,
        lit ? meta.bg : 'bg-white/[0.025]',
      )}
      style={{ width: CARD_W, height: CARD_H, boxShadow: lit ? meta.glow : undefined }}
      animate={lit ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={{ duration: 0.38 }}
    >
      <div className="absolute top-0 inset-x-0 h-[2.5px]"
        style={{ background: meta.color, boxShadow: lit ? `0 0 10px ${meta.color}, 0 0 20px ${meta.color}60` : undefined }} />
      <div className={cn('absolute inset-0 opacity-[0.12] bg-gradient-to-b', meta.gradient)} />
      {lit && (
        <motion.div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,.07) 0%,transparent 50%,rgba(255,255,255,.04) 100%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <span className="text-[34px] leading-none relative z-10">{reward.icon}</span>
      <p className="text-[9px] font-bold text-white/90 text-center leading-tight px-1.5 relative z-10 line-clamp-2">
        {reward.name}
      </p>
      <span className={cn('text-[7px] font-black uppercase tracking-wider relative z-10', meta.textColor)}>
        {meta.label}
      </span>
    </motion.div>
  );
}

// ── Single reel ───────────────────────────────────────────────────────────────
function Reel({
  track, ctrl, stopped, accentColor, selectable, onSelect,
}: {
  track:       CaseReward[];
  ctrl:        ReturnType<typeof useAnimation>;
  stopped:     boolean;
  accentColor: string;
  selectable:  boolean;
  onSelect:    () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-hidden flex-shrink-0"
        onClick={selectable ? onSelect : undefined}
        style={{
          width:      CARD_W + 20,
          height:     CONTAINER_H,
          cursor:     selectable ? 'pointer' : 'default',
          background: 'linear-gradient(180deg,rgba(6,6,16,.95) 0%,rgba(10,10,22,.92) 50%,rgba(6,6,16,.95) 100%)',
          border:     selectable
            ? `2px solid ${accentColor}`
            : `1.5px solid ${stopped ? accentColor + '60' : 'rgba(255,255,255,0.07)'}`,
          boxShadow:  selectable
            ? `0 0 30px ${accentColor}60, 0 0 60px ${accentColor}25, inset 0 0 20px ${accentColor}15`
            : stopped
            ? `0 0 20px ${accentColor}35, inset 0 0 24px rgba(0,0,0,.4)`
            : 'inset 0 0 20px rgba(0,0,0,.4)',
          transition: 'border 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Selectable pulse overlay */}
        {selectable && (
          <motion.div className="absolute inset-0 rounded-2xl pointer-events-none z-30"
            style={{ background: `${accentColor}10` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}

        {/* Top mist */}
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none"
          style={{ height: STRIDE * 1.1, background: 'linear-gradient(to bottom,rgba(6,6,16,.98) 0%,rgba(6,6,16,.55) 55%,transparent 100%)' }}
        />
        {/* Bottom mist */}
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none"
          style={{ height: STRIDE * 1.1, background: 'linear-gradient(to top,rgba(6,6,16,.98) 0%,rgba(6,6,16,.55) 55%,transparent 100%)' }}
        />

        {/* FIXED: absolute top-0 prevents flex-centering offset bug */}
        <motion.div animate={ctrl} className="absolute inset-x-0 top-0 flex flex-col items-center"
          style={{ y: 0, willChange: 'transform', gap: CARD_GAP }}>
          {track.map((item, i) => (
            <ReelCard key={i} reward={item} lit={stopped && i === WINNER_IDX} />
          ))}
        </motion.div>
      </div>

      {/* "Pick this reel" button — appears in reroll selecting mode */}
      <AnimatePresence>
        {selectable && (
          <motion.button
            className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
            style={{ background: accentColor, boxShadow: `0 0 16px ${accentColor}` }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onSelect}
          >
            ⟳ Крутить
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Payline ───────────────────────────────────────────────────────────────────
function Payline({ color, pulsing }: { color: string; pulsing: boolean }) {
  const top    = CONTAINER_H / 2 - CARD_H / 2 - 6;
  const height = CARD_H + 12;
  return (
    <div className="absolute inset-x-0 z-30 pointer-events-none" style={{ top, height }}>
      <motion.div className="absolute top-0 inset-x-0 h-[1.5px]"
        style={{ background: `linear-gradient(90deg,transparent 3%,${color} 15%,${color} 85%,transparent 97%)` }}
        animate={pulsing ? { boxShadow: [`0 0 6px ${color}`,`0 0 16px ${color}`,`0 0 6px ${color}`] } : { boxShadow: `0 0 8px ${color}90` }}
        transition={{ duration: 0.75, repeat: pulsing ? Infinity : 0 }}
      />
      <div className="absolute inset-x-0" style={{ top: 1.5, bottom: 1.5, background: `linear-gradient(to bottom,${color}06,${color}0a,${color}06)` }} />
      <motion.div className="absolute bottom-0 inset-x-0 h-[1.5px]"
        style={{ background: `linear-gradient(90deg,transparent 3%,${color} 15%,${color} 85%,transparent 97%)` }}
        animate={pulsing ? { boxShadow: [`0 0 6px ${color}`,`0 0 16px ${color}`,`0 0 6px ${color}`] } : { boxShadow: `0 0 8px ${color}90` }}
        transition={{ duration: 0.75, repeat: pulsing ? Infinity : 0, delay: 0.1 }}
      />
      <motion.div className="absolute -left-5 top-1/2 -translate-y-1/2"
        animate={pulsing ? { x: [0,3,0], opacity: [.7,1,.7] } : { opacity: 0.6 }}
        transition={{ duration: 0.6, repeat: pulsing ? Infinity : 0 }}
      >
        <div style={{ width:0, height:0, borderTop:'6px solid transparent', borderBottom:'6px solid transparent', borderLeft:`10px solid ${color}`, filter:`drop-shadow(0 0 4px ${color})` }} />
      </motion.div>
      <motion.div className="absolute -right-5 top-1/2 -translate-y-1/2"
        animate={pulsing ? { x: [0,-3,0], opacity: [.7,1,.7] } : { opacity: 0.6 }}
        transition={{ duration: 0.6, repeat: pulsing ? Infinity : 0 }}
      >
        <div style={{ width:0, height:0, borderTop:'6px solid transparent', borderBottom:'6px solid transparent', borderRight:`10px solid ${color}`, filter:`drop-shadow(0 0 4px ${color})` }} />
      </motion.div>
    </div>
  );
}

// ── Stop flash ────────────────────────────────────────────────────────────────
function StopFlash({ visible, color }: { visible: boolean; color: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ zIndex: 25, backgroundColor: color }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.28, 0] }} exit={{ opacity: 0 }}
          transition={{ duration: 0.38 }}
        />
      )}
    </AnimatePresence>
  );
}

// ── Match / Reroll banners ────────────────────────────────────────────────────
const MATCH_CFG: Record<MatchType, { emoji: string; label: string; color: string; sub: string }> = {
  triple: { emoji: '⚡', label: 'ТРОЙНОЙ МАТЧ',         color: '#FBBF24', sub: 'Максимальная награда!'            },
  double: { emoji: '✦', label: 'ДВОЙНОЙ МАТЧ',          color: '#A78BFA', sub: 'Усиленная награда!'               },
  reroll: { emoji: '🔄', label: 'ВСЕ РАЗНЫЕ — РЕРОЛЛ!', color: '#06B6D4', sub: 'Выбери барабан для повторного кручения' },
};

function MatchBanner({ type }: { type: MatchType | null }) {
  const cfg = type ? MATCH_CFG[type] : null;
  return (
    <AnimatePresence>
      {cfg && (
        <motion.div className="flex flex-col items-center gap-1 text-center"
          initial={{ opacity: 0, scale: 0.7, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        >
          <motion.p className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em]"
            style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.color}, 0 0 40px ${cfg.color}60` }}
            animate={type === 'triple' ? { scale: [1,1.07,1] } : type === 'reroll' ? { scale: [1,1.04,1] } : {}}
            transition={{ duration: 0.6, repeat: type === 'triple' ? 3 : type === 'reroll' ? Infinity : 0 }}
          >
            {cfg.emoji} {cfg.label} {cfg.emoji}
          </motion.p>
          {cfg.sub && <p className="text-xs text-white/50 font-semibold">{cfg.sub}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Status chips ──────────────────────────────────────────────────────────────
function ReelChips({ stopped, accentColor }: { stopped: boolean[]; accentColor: string }) {
  return (
    <div className="flex gap-3 justify-center">
      {['Р1','Р2','Р3'].map((label, i) => (
        <motion.div key={i}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
          animate={{
            background:  stopped[i] ? `${accentColor}20` : 'rgba(255,255,255,.04)',
            borderColor: stopped[i] ? `${accentColor}60` : 'rgba(255,255,255,.1)',
            color:       stopped[i] ? accentColor        : 'rgba(255,255,255,.3)',
          }}
          style={{ border: '1px solid' }} transition={{ duration: 0.3 }}
        >
          <motion.span animate={stopped[i] ? { scale:[1,1.4,1] } : {}} transition={{ duration: 0.3 }}>
            {stopped[i] ? '✓' : label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export interface ThreeReelsProps {
  rewards:     CaseReward[];
  result:      CaseReward | null;
  spinning:    boolean;
  onComplete:  (reward: CaseReward) => void; // passes final reward (may differ after reroll)
  accentColor: string;
}

export function ThreeReels({ rewards, result, spinning, onComplete, accentColor }: ThreeReelsProps) {
  const ctrl0 = useAnimation();
  const ctrl1 = useAnimation();
  const ctrl2 = useAnimation();
  const controls = [ctrl0, ctrl1, ctrl2];

  const [tracks,      setTracks]      = useState<CaseReward[][]>(() =>
    Array.from({ length: 3 }, () => Array.from({ length: TRACK_LEN }, () => pickWeightedReward(rewards))));
  const [stopped,     setStopped]     = useState([false, false, false]);
  const [flash,       setFlash]       = useState([false, false, false]);
  const [match,       setMatch]       = useState<MatchType | null>(null);
  const [rerollState, setRerollState] = useState<RerollState>('none');

  // ── Reroll handler ────────────────────────────────────────────────────────
  const doReroll = useCallback(async (reelIdx: number) => {
    if (rerollState !== 'selecting') return;
    setRerollState('spinning');
    setMatch(null);

    // New random reward for the re-spun reel
    const newReward = pickWeightedReward(rewards);
    const newTrack  = Array.from({ length: TRACK_LEN }, (_, i) =>
      i === WINNER_IDX ? newReward : pickWeightedReward(rewards));

    setTracks(prev => { const u = [...prev]; u[reelIdx] = newTrack; return u; });
    setStopped(prev => { const n = [...prev]; n[reelIdx] = false; return n; });
    controls[reelIdx].set({ y: 0 });

    requestAnimationFrame(() => requestAnimationFrame(async () => {
      await controls[reelIdx].start({ y: TARGET_Y, transition: { duration: 1.9, ease: [0.12, 0.86, 0.26, 1.0] } });

      setFlash(prev => { const n = [...prev]; n[reelIdx] = true; return n; });
      setTimeout(() => setFlash(prev => { const n = [...prev]; n[reelIdx] = false; return n; }), 380);
      setStopped(prev => { const n = [...prev]; n[reelIdx] = true; return n; });
      setRerollState('done');

      await new Promise<void>(r => setTimeout(r, 1000));
      onComplete(newReward);
    }));
  }, [rerollState, rewards, controls, onComplete]);

  // ── Main spin effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!spinning || !result) return;

    setStopped([false, false, false]);
    setFlash([false, false, false]);
    setMatch(null);
    setRerollState('none');

    const newTracks = buildTracks(rewards, result);
    controls.forEach(c => c.set({ y: 0 }));
    setTracks(newTracks);

    requestAnimationFrame(() => requestAnimationFrame(async () => {
      const promises = controls.map((ctrl, i) =>
        ctrl.start({ y: TARGET_Y, transition: { duration: STOP_DUR[i], ease: [0.12, 0.86, 0.26, 1.0] } }));

      STOP_MS.forEach((ms, i) => {
        setTimeout(() => {
          setFlash(prev => { const n = [...prev]; n[i] = true; return n; });
          setTimeout(() => setFlash(prev => { const n = [...prev]; n[i] = false; return n; }), 380);
          setStopped(prev => { const n = [...prev]; n[i] = true; return n; });
        }, ms);
      });

      await Promise.all(promises);

      const matchCount = newTracks.filter(t => t[WINNER_IDX]?.id === result.id).length;

      if (matchCount >= 3) {
        setMatch('triple');
        await new Promise<void>(r => setTimeout(r, 1600));
        onComplete(result);
      } else if (matchCount >= 2) {
        setMatch('double');
        await new Promise<void>(r => setTimeout(r, 1000));
        onComplete(result);
      } else {
        // All different → reroll mode
        await new Promise<void>(r => setTimeout(r, 700));
        setMatch('reroll');
        setRerollState('selecting');
        // onComplete is NOT called yet — waits for doReroll
      }
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result]);

  const paylinePulsing = spinning && !stopped.every(Boolean);
  const isSelecting    = rerollState === 'selecting';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ReelChips stopped={stopped} accentColor={accentColor} />

      {/* Assembly */}
      <div
        className="relative flex gap-3 p-4 rounded-3xl"
        style={{
          background:     'rgba(4,4,12,0.82)',
          border:         `1px solid ${isSelecting ? accentColor + '60' : accentColor + '30'}`,
          boxShadow:      `0 0 50px ${accentColor}12, 0 32px 64px rgba(0,0,0,0.7)`,
          backdropFilter: 'blur(12px)',
          transition:     'border-color 0.4s',
        }}
      >
        <Payline color={accentColor} pulsing={paylinePulsing} />

        {/* Corner dots */}
        {['-top-1 -left-1','-top-1 -right-1','-bottom-1 -left-1','-bottom-1 -right-1'].map(pos => (
          <motion.div key={pos} className={cn('absolute w-2 h-2 rounded-full', pos)}
            style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
            animate={{ opacity: [0.5,1,0.5], scale: [1,1.3,1] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: Math.random() * 1.5 }}
          />
        ))}

        {[0, 1, 2].map(i => (
          <div key={i} className="relative">
            <Reel
              track={tracks[i] ?? []}
              ctrl={controls[i]}
              stopped={stopped[i]}
              accentColor={accentColor}
              selectable={isSelecting}
              onSelect={() => doReroll(i)}
            />
            <StopFlash visible={flash[i]} color={accentColor} />
          </div>
        ))}
      </div>

      <MatchBanner type={match} />
    </div>
  );
}
