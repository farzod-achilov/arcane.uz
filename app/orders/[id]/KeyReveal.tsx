'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function KeyReveal({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex-1 rounded-xl px-3 py-2 font-mono text-sm select-all"
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
      <button
        onClick={() => setVisible(v => !v)}
        title={visible ? 'Скрыть' : 'Показать'}
        className="p-2 rounded-lg transition-colors flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7280' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      {visible && (
        <button
          onClick={copy}
          title="Скопировать"
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', color: copied ? '#22C55E' : '#6B7280' }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#9CA3AF'; }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#6B7280'; }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
