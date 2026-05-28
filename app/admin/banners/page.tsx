'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Eye, EyeOff, ChevronUp, ChevronDown, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface Banner {
  id:         string;
  title:      string;
  subtitle:   string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl:   string | null;
  badgeText:  string | null;
  colorFrom:  string;
  colorTo:    string;
  isActive:   boolean;
  sortOrder:  number;
}

const EMPTY: Omit<Banner, 'id' | 'sortOrder'> = {
  title: '', subtitle: '', buttonText: '', buttonLink: '',
  imageUrl: '', badgeText: '', colorFrom: '#7C3AED', colorTo: '#06B6D4', isActive: true,
};

function BannerPreview({ b }: { b: typeof EMPTY }) {
  return (
    <div className="rounded-xl overflow-hidden relative flex items-center"
         style={{ height: '80px', background: `linear-gradient(135deg, ${b.colorFrom}33, ${b.colorTo}22)`,
                  border: '1px solid rgba(255,255,255,0.07)' }}>
      {b.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,4,11,0.9) 40%, transparent)' }} />
      <div className="relative z-10 px-4">
        {b.badgeText && (
          <span className="font-pixel text-white block mb-0.5" style={{ fontSize: '7px', opacity: 0.7 }}>{b.badgeText}</span>
        )}
        <p className="font-heading font-bold text-white" style={{ fontSize: '13px' }}>{b.title || 'Заголовок'}</p>
        {b.subtitle && (
          <p className="font-body text-[#9CA3AF]" style={{ fontSize: '10px' }}>{b.subtitle}</p>
        )}
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-body text-[#6B7280] block mb-1" style={{ fontSize: '11px' }}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
               className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
               className="flex-1 rounded-xl px-3 py-2 text-white font-body outline-none"
               style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px' }} />
      </div>
    </div>
  );
}

export default function AdminBannersPage() {
  const [banners,  setBanners]  = useState<Banner[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Banner | null>(null);
  const [isNew,    setIsNew]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/banners');
    const data = await res.json();
    setBanners(data.banners ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(EMPTY);
    setEditing(null);
    setIsNew(true);
  }

  function openEdit(b: Banner) {
    setForm({ title: b.title, subtitle: b.subtitle ?? '', buttonText: b.buttonText ?? '',
              buttonLink: b.buttonLink ?? '', imageUrl: b.imageUrl ?? '', badgeText: b.badgeText ?? '',
              colorFrom: b.colorFrom, colorTo: b.colorTo, isActive: b.isActive });
    setEditing(b);
    setIsNew(false);
  }

  function close() { setEditing(null); setIsNew(false); }

  async function save() {
    setSaving(true);
    const body = {
      ...form,
      subtitle:   form.subtitle   || null,
      buttonText: form.buttonText || null,
      buttonLink: form.buttonLink || null,
      imageUrl:   form.imageUrl   || null,
      badgeText:  form.badgeText  || null,
    };
    if (isNew) {
      const res = await fetch('/api/admin/banners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, sortOrder: banners.length }),
      });
      const data = await res.json();
      if (data.ok) setBanners(prev => [...prev, data.banner]);
    } else if (editing) {
      const res = await fetch(`/api/admin/banners/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) setBanners(prev => prev.map(b => b.id === editing.id ? { ...b, ...data.banner } : b));
    }
    setSaving(false);
    close();
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function deleteBanner(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    setBanners(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
  }

  async function move(id: string, dir: 1 | -1) {
    const idx = banners.findIndex(b => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[idx], next[target]] = [next[target], next[idx]];
    setBanners(next);
    await Promise.all([
      fetch(`/api/admin/banners/${next[idx].id}`,    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: idx }) }),
      fetch(`/api/admin/banners/${next[target].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: target }) }),
    ]);
  }

  const f = (k: keyof typeof form, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.14em' }}>ГЛАВНАЯ СТРАНИЦА</p>
          <h1 className="font-heading font-bold text-white" style={{ fontSize: '22px' }}>Промо-баннеры</h1>
          <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>
            {banners.filter(b => b.isActive).length} активных · {banners.length} всего
          </p>
        </div>
        <button onClick={openNew}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-heading font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
          <Plus style={{ width: '14px', height: '14px' }} />
          Новый баннер
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 style={{ width: '20px', height: '20px', color: '#374151' }} className="animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ImageIcon style={{ width: '32px', height: '32px', color: '#374151', marginBottom: '12px' }} />
          <p className="font-heading font-semibold text-[#4B5563]" style={{ fontSize: '15px' }}>Баннеров нет</p>
          <p className="font-body text-[#374151] mt-1 mb-5" style={{ fontSize: '12px' }}>Создайте первый промо-баннер для главной страницы</p>
          <button onClick={openNew}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-heading font-semibold text-white"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', fontSize: '13px' }}>
            <Plus style={{ width: '13px', height: '13px' }} /> Создать баннер
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <motion.div key={b.id} layout
                        className="rounded-2xl p-4 flex items-center gap-4"
                        style={{ background: '#0D0D1A', border: `1px solid ${b.isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                 opacity: b.isActive ? 1 : 0.55 }}>
              {/* Preview */}
              <div className="w-48 flex-shrink-0">
                <BannerPreview b={{ ...b, subtitle: b.subtitle ?? '', buttonText: b.buttonText ?? '',
                  buttonLink: b.buttonLink ?? '', imageUrl: b.imageUrl ?? '', badgeText: b.badgeText ?? '' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>{b.title}</p>
                  <span className="font-pixel rounded px-1.5 py-0.5"
                        style={{ fontSize: '7px', background: b.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.15)',
                                 color: b.isActive ? '#4ADE80' : '#6B7280' }}>
                    {b.isActive ? 'АКТИВЕН' : 'СКРЫТ'}
                  </span>
                </div>
                {b.subtitle && <p className="font-body text-[#4B5563] truncate" style={{ fontSize: '12px' }}>{b.subtitle}</p>}
                {b.buttonLink && <p className="font-body text-[#374151] truncate" style={{ fontSize: '11px' }}>{b.buttonLink}</p>}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: b.colorFrom }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: b.colorTo }} />
                  <span className="font-body text-[#374151]" style={{ fontSize: '10px' }}>#{i + 1} по порядку</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => move(b.id, -1)} disabled={i === 0}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ChevronUp style={{ width: '13px', height: '13px', color: '#6B7280' }} />
                </button>
                <button onClick={() => move(b.id, 1)} disabled={i === banners.length - 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ChevronDown style={{ width: '13px', height: '13px', color: '#6B7280' }} />
                </button>

                <button onClick={() => toggleActive(b)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: b.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,100,100,0.1)' }}
                        title={b.isActive ? 'Скрыть' : 'Показать'}>
                  {b.isActive
                    ? <Eye    style={{ width: '12px', height: '12px', color: '#4ADE80' }} />
                    : <EyeOff style={{ width: '12px', height: '12px', color: '#6B7280' }} />}
                </button>

                <button onClick={() => openEdit(b)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Edit2 style={{ width: '12px', height: '12px', color: '#A78BFA' }} />
                </button>

                <button onClick={() => deleteBanner(b.id)} disabled={deleting === b.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                        style={{ background: 'rgba(239,68,68,0.1)' }}>
                  {deleting === b.id
                    ? <Loader2 style={{ width: '12px', height: '12px', color: '#F87171' }} className="animate-spin" />
                    : <Trash2  style={{ width: '12px', height: '12px', color: '#F87171' }} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Create modal */}
      <AnimatePresence>
        {(isNew || editing) && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ background: 'rgba(0,0,0,0.8)' }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={close}>
            <motion.div className="w-full max-w-lg rounded-2xl overflow-hidden"
                        style={{ background: '#0D0D1A', border: '1px solid rgba(124,58,237,0.3)' }}
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between px-6 py-4"
                   style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-heading font-bold text-white" style={{ fontSize: '16px' }}>
                  {isNew ? 'Новый баннер' : 'Редактировать баннер'}
                </p>
                <button onClick={close} style={{ color: '#374151' }}><X style={{ width: '16px', height: '16px' }} /></button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                {/* Preview */}
                <BannerPreview b={form} />

                {[
                  { label: 'Заголовок *', key: 'title'      as const, placeholder: 'Например: Новинки недели' },
                  { label: 'Подзаголовок', key: 'subtitle'  as const, placeholder: 'Краткое описание или акция' },
                  { label: 'Бейдж',        key: 'badgeText' as const, placeholder: 'NEW · SALE · HOT' },
                  { label: 'Кнопка',       key: 'buttonText'as const, placeholder: 'Смотреть →' },
                  { label: 'Ссылка',       key: 'buttonLink'as const, placeholder: '/catalog или https://...' },
                  { label: 'Изображение (URL)', key: 'imageUrl' as const, placeholder: 'https://...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="font-body text-[#6B7280] block mb-1" style={{ fontSize: '11px' }}>{label}</label>
                    <input type="text" value={form[key] as string}
                           onChange={e => f(key, e.target.value)}
                           placeholder={placeholder}
                           className="w-full rounded-xl px-3 py-2.5 text-white font-body outline-none placeholder:text-[#1F2937]"
                           style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }} />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <ColorInput label="Цвет от"  value={form.colorFrom} onChange={v => f('colorFrom', v)} />
                  <ColorInput label="Цвет до"   value={form.colorTo}   onChange={v => f('colorTo',   v)} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => f('isActive', !form.isActive)}
                       className="w-4 h-4 rounded flex items-center justify-center transition-all"
                       style={{ background: form.isActive ? '#7C3AED' : 'transparent',
                                border: `1px solid ${form.isActive ? '#7C3AED' : 'rgba(255,255,255,0.15)'}` }}>
                    {form.isActive && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                  </div>
                  <span className="font-body text-[#9CA3AF]" style={{ fontSize: '13px' }}>Показывать на сайте</span>
                </label>
              </div>

              <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={close}
                        className="flex-1 rounded-xl py-2.5 font-heading font-semibold transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280', fontSize: '13px' }}>
                  Отмена
                </button>
                <button onClick={save} disabled={saving || !form.title.trim()}
                        className="flex-1 rounded-xl py-2.5 font-heading font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', fontSize: '13px' }}>
                  {saving
                    ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" />
                    : null}
                  {saving ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
