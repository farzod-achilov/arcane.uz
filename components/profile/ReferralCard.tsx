'use client';

import { useState } from 'react';
import { Copy, Check, Users, Zap, Share2, Link2, Trophy, Star } from 'lucide-react';
import Image from 'next/image';

interface ReferredUser {
  username: string;
  avatar:   string | null;
  createdAt: Date | string;
}

interface Props {
  code:             string;
  referralLink:     string;
  totalReferrals:   number;
  totalCoinsEarned: number;
  referredUsers:    ReferredUser[];
}

/* ── Tiers ───────────────────────────────────────────── */
const TIERS = [
  { label: 'Новичок',   min: 0,  max: 5,  bonus: 200, color: '#9CA3AF', glow: 'rgba(156,163,175,0.3)', icon: '🌱' },
  { label: 'Бронза',    min: 5,  max: 15, bonus: 250, color: '#CD7F32', glow: 'rgba(205,127,50,0.3)',  icon: '🥉' },
  { label: 'Серебро',   min: 15, max: 30, bonus: 300, color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', icon: '🥈' },
  { label: 'Золото',    min: 30, max: 50, bonus: 400, color: '#FFD700', glow: 'rgba(255,215,0,0.3)',   icon: '🥇' },
  { label: 'Легенда',   min: 50, max: Infinity, bonus: 500, color: '#9D60FA', glow: 'rgba(157,96,250,0.4)', icon: '👑' },
];

function getTier(n: number) {
  return TIERS.find(t => n >= t.min && n < t.max) ?? TIERS[TIERS.length - 1];
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-heading font-semibold transition-all flex-shrink-0"
      style={{
        fontSize:   '12px',
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(6,182,212,0.1)',
        border:     `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(6,182,212,0.25)'}`,
        color:      copied ? '#4ADE80' : '#06B6D4',
      }}
    >
      {copied
        ? <><Check style={{ width: '12px', height: '12px' }} /> Скопировано</>
        : <><Copy  style={{ width: '12px', height: '12px' }} /> {label}</>}
    </button>
  );
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30)  return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  return `${months} мес. назад`;
}

export default function ReferralCard({ code, referralLink, totalReferrals, totalCoinsEarned, referredUsers }: Props) {
  const tier     = getTier(totalReferrals);
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const progress = nextTier
    ? ((totalReferrals - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;

  return (
    <div className="space-y-4">

      {/* ── Tier card ── */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
           style={{ background: '#0D0D16', border: `1px solid ${tier.color}30` }}>
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
             style={{ background: `radial-gradient(circle at top right, ${tier.glow}, transparent 65%)` }} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '20px' }}>{tier.icon}</span>
            <div>
              <p className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>{tier.label}</p>
              <p className="font-body" style={{ fontSize: '11px', color: tier.color }}>
                +{tier.bonus} ARC за каждого реферала
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-white" style={{ fontSize: '28px' }}>
              {totalReferrals}
            </p>
            <p className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>приглашено</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>
                До уровня {nextTier.label} {nextTier.icon}
              </span>
              <span className="font-body" style={{ fontSize: '11px', color: tier.color }}>
                {totalReferrals}/{nextTier.min}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
                            boxShadow: `0 0 8px ${tier.glow}` }} />
            </div>
            <p className="font-body text-[#4B5563] mt-1.5" style={{ fontSize: '10.5px' }}>
              Ещё {nextTier.min - totalReferrals} чел. → +{nextTier.bonus - tier.bonus} ARC бонус
            </p>
          </div>
        )}
        {!nextTier && (
          <p className="font-body mt-1" style={{ fontSize: '11px', color: tier.color }}>
            🏆 Максимальный уровень — +{tier.bonus} ARC за каждого!
          </p>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 relative overflow-hidden"
             style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.18)' }}>
          <div className="absolute top-0 right-0 w-16 h-16"
               style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 70%)' }} />
          <Users style={{ width: '14px', height: '14px', color: '#7C3AED', marginBottom: '8px' }} />
          <p className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>{totalReferrals}</p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Приглашено друзей</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden"
             style={{ background: '#0D0D16', border: '1px solid rgba(245,158,11,0.18)' }}>
          <div className="absolute top-0 right-0 w-16 h-16"
               style={{ background: 'radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 70%)' }} />
          <Zap style={{ width: '14px', height: '14px', color: '#F59E0B', marginBottom: '8px' }} />
          <p className="font-heading font-bold text-white" style={{ fontSize: '24px' }}>
            {totalCoinsEarned.toLocaleString('ru')}
          </p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>ARC Coins заработано</p>
        </div>
      </div>

      {/* ── Code + link ── */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Share2 style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
          <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Ваш реферальный код</span>
        </div>
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl"
             style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <span className="font-pixel flex-1 text-white" style={{ fontSize: '14px', letterSpacing: '0.12em' }}>{code}</span>
          <CopyButton text={code} label="Код" />
        </div>
        <div className="flex items-start gap-3 p-3 rounded-xl"
             style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <Link2 style={{ width: '13px', height: '13px', color: '#06B6D4', marginTop: '2px', flexShrink: 0 }} />
          <span className="font-body text-[#4B5563] flex-1 break-all" style={{ fontSize: '11px' }}>{referralLink}</span>
          <CopyButton text={referralLink} label="Ссылка" />
        </div>
      </div>

      {/* ── Tiers overview ── */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
          <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Уровни наград</span>
        </div>
        <div className="space-y-2">
          {TIERS.map(t => {
            const isCurrent = t.label === tier.label;
            return (
              <div key={t.label}
                   className="flex items-center justify-between rounded-xl px-3 py-2"
                   style={{
                     background: isCurrent ? `${t.color}12` : 'transparent',
                     border:     `1px solid ${isCurrent ? t.color + '35' : 'transparent'}`,
                   }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '14px' }}>{t.icon}</span>
                  <span className="font-heading font-semibold" style={{ fontSize: '12px', color: isCurrent ? t.color : '#6B7280' }}>
                    {t.label}
                  </span>
                  <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>
                    {t.max === Infinity ? `${t.min}+` : `${t.min}–${t.max - 1}`} рефералов
                  </span>
                </div>
                <span className="font-heading font-semibold" style={{ fontSize: '12px', color: isCurrent ? t.color : '#4B5563' }}>
                  +{t.bonus} ARC
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Referral history ── */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
          <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Приглашённые игроки</span>
          {referredUsers.length > 0 && (
            <span className="font-pixel rounded-full px-2 py-0.5"
                  style={{ fontSize: '8px', background: 'rgba(124,58,237,0.2)', color: '#C4B5FD' }}>
              {referredUsers.length}
            </span>
          )}
        </div>

        {referredUsers.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Star style={{ width: '28px', height: '28px', color: '#374151', marginBottom: '12px' }} />
            <p className="font-heading font-semibold text-[#4B5563]" style={{ fontSize: '14px' }}>
              Пока никто не зарегистрировался
            </p>
            <p className="font-body text-[#374151] mt-1" style={{ fontSize: '12px' }}>
              Поделитесь ссылкой и получайте ARC Coins
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                   style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {u.avatar ? (
                  <Image src={u.avatar} alt={u.username} width={28} height={28}
                         unoptimized className="rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-heading font-bold text-white"
                       style={{ background: 'rgba(124,58,237,0.25)', fontSize: '11px' }}>
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-heading font-semibold text-white flex-1" style={{ fontSize: '13px' }}>
                  {u.username}
                </span>
                <span className="font-body text-[#374151]" style={{ fontSize: '11px' }}>
                  {timeAgo(u.createdAt)}
                </span>
                <span className="font-pixel rounded px-2 py-0.5"
                      style={{ fontSize: '8px', background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  +{tier.bonus} ARC
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>Как это работает</p>
        <div className="space-y-3">
          {[
            { step: '01', text: 'Поделитесь своей ссылкой или кодом с друзьями', color: '#7C3AED' },
            { step: '02', text: 'Друг регистрируется по вашей ссылке', color: '#06B6D4' },
            { step: '03', text: `Вы получаете +${tier.bonus} ARC Coins (бонус растёт с уровнем!)`, color: '#F59E0B' },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-pixel flex-shrink-0 w-6 text-center"
                    style={{ fontSize: '8px', color, lineHeight: '20px' }}>{step}</span>
              <span className="font-body text-[#6B7280]" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
