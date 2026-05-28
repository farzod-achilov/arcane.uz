'use client';

import { CheckCircle2 } from 'lucide-react';

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://arcane.com.uz';
const TG_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? '8889652013';

function TelegramIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function SteamIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
    </svg>
  );
}

export default function SocialLinks({
  tgLinked, tgUsername, steamLinked, steamName,
}: {
  tgLinked:   boolean;
  tgUsername: string | null;
  steamLinked: boolean;
  steamName:  string | null;
}) {
  function linkTelegram() {
    const returnTo = `${APP_URL}/auth/telegram-callback`;
    window.location.href = [
      'https://oauth.telegram.org/auth',
      `?client_id=${TG_BOT_ID}`,
      `&origin=${encodeURIComponent(APP_URL)}`,
      `&return_to=${encodeURIComponent(returnTo)}`,
      '&scope=openid+profile',
    ].join('');
  }

  function linkSteam() {
    const returnTo = `${APP_URL}/api/auth/steam-callback`;
    const realm    = APP_URL;
    window.location.href = [
      'https://steamcommunity.com/openid/login',
      '?openid.ns=http://specs.openid.net/auth/2.0',
      '&openid.mode=checkid_setup',
      `&openid.return_to=${encodeURIComponent(returnTo)}`,
      `&openid.realm=${encodeURIComponent(realm)}`,
      '&openid.identity=http://specs.openid.net/auth/2.0/identifier_select',
      '&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select',
    ].join('');
  }

  const badges = [
    {
      linked:   tgLinked,
      name:     tgUsername ? `@${tgUsername}` : 'Telegram',
      linkLabel:'Привязать Telegram',
      icon:     <TelegramIcon />,
      onLink:   linkTelegram,
      linkedBg: 'rgba(6,182,212,0.08)',
      linkedBorder: 'rgba(6,182,212,0.2)',
      linkedColor:  '#22D3EE',
      hoverBorder:  'rgba(6,182,212,0.4)',
      hoverColor:   '#22D3EE',
      hoverBg:      'rgba(6,182,212,0.12)',
      idleBg:       'rgba(6,182,212,0.04)',
      idleBorder:   'rgba(6,182,212,0.15)',
    },
    {
      linked:   steamLinked,
      name:     steamName ?? 'Steam',
      linkLabel:'Привязать Steam',
      icon:     <SteamIcon />,
      onLink:   linkSteam,
      linkedBg:     'rgba(102,192,244,0.08)',
      linkedBorder: 'rgba(102,192,244,0.2)',
      linkedColor:  '#66C0F4',
      hoverBorder:  'rgba(102,192,244,0.4)',
      hoverColor:   '#66C0F4',
      hoverBg:      'rgba(102,192,244,0.12)',
      idleBg:       'rgba(102,192,244,0.04)',
      idleBorder:   'rgba(102,192,244,0.15)',
    },
  ];

  return (
    <div className="flex items-center gap-2 mt-2 mb-3 flex-wrap">
      {badges.map(b => b.linked ? (
        <div key={b.name}
             className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
             style={{ background: b.linkedBg, border: `1px solid ${b.linkedBorder}` }}>
          <CheckCircle2 style={{ width: '10px', height: '10px', color: b.linkedColor }} />
          <span style={{ color: b.linkedColor }}>{b.icon}</span>
          <span className="font-body" style={{ fontSize: '11px', color: b.linkedColor }}>{b.name}</span>
        </div>
      ) : (
        <button key={b.linkLabel}
                onClick={b.onLink}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all duration-200"
                style={{ background: b.idleBg, border: `1px solid ${b.idleBorder}`, color: '#6B7280' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = b.hoverBorder;
                  el.style.color       = b.hoverColor;
                  el.style.background  = b.hoverBg;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = b.idleBorder;
                  el.style.color       = '#6B7280';
                  el.style.background  = b.idleBg;
                }}>
          <span className="text-current">{b.icon}</span>
          <span className="font-body" style={{ fontSize: '11px' }}>{b.linkLabel}</span>
        </button>
      ))}
    </div>
  );
}
