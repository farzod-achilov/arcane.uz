'use client';

import { CheckCircle2, ExternalLink } from 'lucide-react';

const TG_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? '8889652013';
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';

function TelegramIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function SteamIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
    </svg>
  );
}

export default function SocialLinks({
  tgLinked,
  tgUsername,
}: {
  tgLinked:   boolean;
  tgUsername: string | null;
}) {
  function linkTelegram() {
    const returnTo = `${APP_URL}/auth/telegram-callback`;
    const url = [
      'https://oauth.telegram.org/auth',
      `?client_id=${TG_BOT_ID}`,
      `&origin=${encodeURIComponent(APP_URL)}`,
      `&return_to=${encodeURIComponent(returnTo)}`,
      '&scope=openid+profile',
    ].join('');
    window.location.href = url;
  }

  return (
    <div className="flex items-center gap-2 mt-2 mb-3 flex-wrap">
      {/* Telegram */}
      {tgLinked ? (
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
          style={{
            background: 'rgba(6,182,212,0.08)',
            border:     '1px solid rgba(6,182,212,0.2)',
          }}
        >
          <CheckCircle2 style={{ width: '11px', height: '11px', color: '#22D3EE' }} />
          <TelegramIcon size={11} />
          <span className="font-body text-[#22D3EE]" style={{ fontSize: '11px' }}>
            {tgUsername ? `@${tgUsername}` : 'Telegram'}
          </span>
        </div>
      ) : (
        <button
          onClick={linkTelegram}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all duration-200"
          style={{
            background: 'rgba(6,182,212,0.06)',
            border:     '1px solid rgba(6,182,212,0.18)',
            color:      '#6B7280',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)';
            (e.currentTarget as HTMLElement).style.color       = '#22D3EE';
            (e.currentTarget as HTMLElement).style.background  = 'rgba(6,182,212,0.12)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.18)';
            (e.currentTarget as HTMLElement).style.color       = '#6B7280';
            (e.currentTarget as HTMLElement).style.background  = 'rgba(6,182,212,0.06)';
          }}
        >
          <TelegramIcon size={11} />
          <span className="font-body" style={{ fontSize: '11px' }}>Привязать Telegram</span>
          <ExternalLink style={{ width: '9px', height: '9px' }} />
        </button>
      )}

      {/* Steam — placeholder (coming soon) */}
      <div
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 cursor-not-allowed"
        title="Скоро"
        style={{
          background: 'rgba(102,192,244,0.04)',
          border:     '1px solid rgba(102,192,244,0.12)',
          color:      '#374151',
        }}
      >
        <SteamIcon size={11} />
        <span className="font-body" style={{ fontSize: '11px' }}>Привязать Steam</span>
        <span className="font-pixel rounded px-1"
              style={{ fontSize: '7px', background: 'rgba(255,255,255,0.05)', color: '#4B5563' }}>
          скоро
        </span>
      </div>
    </div>
  );
}
