'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ExternalLink, Info } from 'lucide-react';
import { parseDeliveredValue } from '@/lib/deliveryFormat';

function CopyIconButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Скопировать"
      className="p-2 rounded-lg transition-colors flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', color: copied ? '#22C55E' : '#6B7280' }}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function MaskedField({ label, value, visible }: { label: string; value: string; visible: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-body" style={{ fontSize: '10.5px', color: '#6B7280' }}>{label}</p>
        <p
          className="font-mono truncate"
          style={{
            fontSize: '13px', color: visible ? '#E2E8F0' : 'transparent',
            textShadow: visible ? 'none' : '0 0 8px rgba(200,200,255,0.6)',
            filter: visible ? 'none' : 'blur(4px)', userSelect: visible ? 'text' : 'none',
          }}
        >
          {value}
        </p>
      </div>
      {visible && <CopyIconButton value={value} />}
    </div>
  );
}

export default function KeyReveal({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const parsed = parseDeliveredValue(value);

  const EyeToggle = (
    <button
      onClick={() => setVisible(v => !v)}
      title={visible ? 'Скрыть' : 'Показать'}
      className="p-2 rounded-lg transition-colors flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280' }}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  // ── Аккаунт (Steam + email-логин, найденные при доставке "Steam Account" SKU) ──
  if (parsed.type === 'account') {
    return (
      <div className="mt-2 rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="flex items-start gap-2 mb-3">
          <Info style={{ width: '14px', height: '14px', color: '#7C3AED', flexShrink: 0, marginTop: '1px' }} />
          <p className="font-body" style={{ fontSize: '12px', color: '#C4B5FD' }}>
            Это готовый Steam-аккаунт с игрой — не ключ активации. Войдите в Steam с этими данными.
            Если Steam запросит код подтверждения, используйте данные почты ниже.
          </p>
        </div>
        <div className="flex justify-end mb-2">{EyeToggle}</div>
        <div className="space-y-3">
          {parsed.pairs.map((p, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="font-heading font-semibold mb-1.5" style={{ fontSize: '11px', color: p.label === 'Steam' ? '#9D60FA' : '#06B6D4' }}>
                {p.label === 'Steam' ? '🎮 Steam' : '✉️ Почта (для кода подтверждения)'}
              </p>
              <div className="space-y-1.5">
                <MaskedField label="Логин" value={p.login} visible={visible} />
                {p.password && <MaskedField label="Пароль" value={p.password} visible={visible} />}
              </div>
            </div>
          ))}
        </div>
        {parsed.extra.length > 0 && visible && (
          <details className="mt-2.5">
            <summary className="font-body cursor-pointer" style={{ fontSize: '11px', color: '#6B7280' }}>
              Дополнительная информация от поставщика
            </summary>
            <p className="font-body mt-1.5 whitespace-pre-wrap" style={{ fontSize: '10.5px', color: '#4B5563' }}>
              {parsed.extra.join('\n')}
            </p>
          </details>
        )}
      </div>
    );
  }

  // ── Ссылка (Steam Gift) или обычный код активации ──
  const isLink = parsed.type === 'link';
  return (
    <div>
      <div className="flex items-center gap-2 mt-2">
        <div
          className="flex-1 rounded-xl px-3 py-2 font-mono text-sm select-all truncate"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border:     '1px solid rgba(124,58,237,0.2)',
            color:      visible ? '#E2E8F0' : 'transparent',
            textShadow: visible ? 'none' : '0 0 8px rgba(200,200,255,0.6)',
            userSelect: visible ? 'text' : 'none',
            filter:     visible ? 'none' : 'blur(5px)',
            transition: 'filter 0.2s, color 0.2s',
            fontSize:   '13px',
            letterSpacing: '0.05em',
          }}
        >
          {value}
        </div>
        {EyeToggle}
        {visible && isLink && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть ссылку"
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {visible && <CopyIconButton value={value} />}
      </div>
      {isLink && (
        <p className="font-body mt-1.5" style={{ fontSize: '11.5px', color: '#6B7280' }}>
          Это ссылка на подарок Steam — откройте её, войдя в свой аккаунт Steam, игра добавится в библиотеку автоматически.
        </p>
      )}
    </div>
  );
}
