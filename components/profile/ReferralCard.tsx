'use client';

import { useState } from 'react';
import { Copy, Check, Users, Zap, Share2, Link2 } from 'lucide-react';

interface Props {
  code:              string;
  referralLink:      string;
  totalReferrals:    number;
  totalCoinsEarned:  number;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-heading font-semibold transition-all flex-shrink-0"
      style={{
        fontSize:   '12px',
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(6,182,212,0.1)',
        border:     `1px solid ${copied ? 'rgba(34,197,94,0.35)' : 'rgba(6,182,212,0.25)'}`,
        color:      copied ? '#4ADE80' : '#06B6D4',
        cursor:     'pointer',
      }}
    >
      {copied
        ? <><Check style={{ width: '12px', height: '12px' }} /> Скопировано</>
        : <><Copy  style={{ width: '12px', height: '12px' }} /> {label}</>
      }
    </button>
  );
}

export default function ReferralCard({ code, referralLink, totalReferrals, totalCoinsEarned }: Props) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 relative overflow-hidden"
             style={{ background: '#0D0D16', border: '1px solid rgba(124,58,237,0.18)' }}>
          <div className="absolute top-0 right-0 w-16 h-16"
               style={{ background: 'radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 70%)' }} />
          <Users style={{ width: '14px', height: '14px', color: '#7C3AED', marginBottom: '10px' }} />
          <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '26px' }}>
            {totalReferrals}
          </p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>Приглашено друзей</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden"
             style={{ background: '#0D0D16', border: '1px solid rgba(245,158,11,0.18)' }}>
          <div className="absolute top-0 right-0 w-16 h-16"
               style={{ background: 'radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 70%)' }} />
          <Zap style={{ width: '14px', height: '14px', color: '#F59E0B', marginBottom: '10px' }} />
          <p className="font-heading font-bold text-white mb-0.5" style={{ fontSize: '26px' }}>
            {totalCoinsEarned.toLocaleString('ru')}
          </p>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '11px' }}>ARC Coins заработано</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Share2 style={{ width: '14px', height: '14px', color: '#7C3AED' }} />
          <span className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>Ваш реферальный код</span>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
             style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <span className="font-pixel flex-1 text-white" style={{ fontSize: '14px', letterSpacing: '0.12em' }}>
            {code}
          </span>
          <CopyButton text={code} label="Код" />
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl"
             style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <Link2 style={{ width: '13px', height: '13px', color: '#06B6D4', marginTop: '2px', flexShrink: 0 }} />
          <span className="font-body text-[#4B5563] flex-1 break-all" style={{ fontSize: '11px' }}>
            {referralLink}
          </span>
          <CopyButton text={referralLink} label="Ссылка" />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-5" style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-heading font-semibold text-white mb-4" style={{ fontSize: '13px' }}>Как это работает</p>
        <div className="space-y-3">
          {[
            { step: '01', text: 'Поделитесь своей ссылкой или кодом с друзьями', color: '#7C3AED' },
            { step: '02', text: 'Друг регистрируется по вашей ссылке', color: '#06B6D4' },
            { step: '03', text: 'Вы получаете +200 ARC Coins за каждого нового игрока', color: '#F59E0B' },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="font-pixel flex-shrink-0 w-6 text-center"
                    style={{ fontSize: '8px', color, lineHeight: '20px' }}>
                {step}
              </span>
              <span className="font-body text-[#6B7280]" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
