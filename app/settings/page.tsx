'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, User as UserIcon, Send, Gamepad2, Bell, Lock, Check } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';

export default function SettingsPage() {
  const { user, isLoggedIn, updateProfile, connectTelegram, connectSteam } = useUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [tgInput, setTgInput] = useState('');
  const [saved, setSaved] = useState('');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifTg, setNotifTg] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
    else if (user) setName(user.name);
  }, [isLoggedIn, user, router]);

  if (!user) return null;

  const saveProfile = () => {
    if (name.trim()) { updateProfile({ name: name.trim() }); setSaved('profile'); setTimeout(() => setSaved(''), 2000); }
  };

  const saveTelegram = () => {
    if (tgInput.trim()) { connectTelegram(tgInput.trim()); setSaved('telegram'); setTgInput(''); setTimeout(() => setSaved(''), 2000); }
  };

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <motion.button
        animate={{ background: value ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : '#1A1A28' }}
        transition={{ duration: 0.25 }}
        onClick={onChange}
        className="relative w-11 h-6 rounded-full cursor-pointer"
        style={{ border: `1px solid ${value ? 'transparent' : 'rgba(255,255,255,0.1)'}` }}
      >
        <motion.div
          animate={{ x: value ? 21 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-[3px] w-4 h-4 bg-white rounded-full"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        />
      </motion.button>
    );
  }

  function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="rounded-2xl overflow-hidden"
           style={{ background: '#0D0D16', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5 px-5 py-4"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="text-[#7C3AED]">{icon}</div>
          <span className="font-heading font-semibold text-[#9CA3AF]"
                style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>
        <div className="p-5">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#05040B', paddingTop: '120px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.018,
           }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="font-heading font-semibold text-[#7C3AED] mb-1"
             style={{ fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Аккаунт
          </p>
          <h1 className="font-heading font-bold text-white mb-8" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>
            Настройки
          </h1>
        </motion.div>

        <div className="space-y-4">

          {/* Profile */}
          <Section title="Профиль" icon={<UserIcon style={{ width: '14px', height: '14px' }} />}>
            <div className="flex items-center gap-4 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover"
                   style={{ border: '2px solid rgba(124,58,237,0.3)' }} />
              <div>
                <p className="font-heading font-semibold text-white" style={{ fontSize: '15px' }}>{user.name}</p>
                <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{user.email}</p>
              </div>
            </div>
            <CheckoutInput
              label="Имя или никнейм"
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon style={{ width: '15px', height: '15px' }} />}
            />
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={saveProfile}
              className="mt-3 inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white"
              style={{
                background: saved === 'profile' ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                padding: '10px 20px',
                fontSize: '13px',
                boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
              }}
            >
              {saved === 'profile' ? <><Check style={{ width: '13px', height: '13px' }} />Сохранено</> : 'Сохранить'}
            </motion.button>
          </Section>

          {/* Email */}
          <Section title="Email & Безопасность" icon={<Mail style={{ width: '14px', height: '14px' }} />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-heading font-medium text-[#9CA3AF]" style={{ fontSize: '13.5px' }}>Email</p>
                  <p className="font-body text-[#4B5563]" style={{ fontSize: '12px' }}>{user.email}</p>
                </div>
                <span className="font-pixel text-[#22C55E] rounded-lg px-2.5 py-1"
                      style={{ fontSize: '7.5px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  ПОДТВЕРЖДЁН
                </span>
              </div>
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <button className="flex items-center gap-2 font-body text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
                      style={{ fontSize: '13px' }}>
                <Lock style={{ width: '13px', height: '13px' }} />
                Изменить пароль
              </button>
            </div>
          </Section>

          {/* Telegram */}
          <Section title="Telegram" icon={<Send style={{ width: '14px', height: '14px' }} />}>
            {user.telegram ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
                    <Send style={{ width: '15px', height: '15px', color: '#06B6D4' }} />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>{user.telegram}</p>
                    <p className="font-body text-[#22C55E]" style={{ fontSize: '11.5px' }}>Подключён</p>
                  </div>
                </div>
                <Check style={{ width: '16px', height: '16px', color: '#22C55E' }} />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-body text-[#6B7280]" style={{ fontSize: '13px' }}>
                  Привяжите Telegram для получения уведомлений о заказах и снижении цен.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="@username"
                    value={tgInput}
                    onChange={(e) => setTgInput(e.target.value)}
                    className="flex-1 font-body text-white outline-none rounded-xl px-4 py-2.5 placeholder:text-[#2D2D44]"
                    style={{ background: '#07070D', border: '1px solid rgba(6,182,212,0.25)', fontSize: '13.5px' }}
                  />
                  <button
                    onClick={saveTelegram}
                    className="rounded-xl px-4 py-2.5 font-heading font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', fontSize: '13px' }}
                  >
                    {saved === 'telegram' ? '✓' : 'Привязать'}
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* Steam */}
          <Section title="Steam" icon={<Gamepad2 style={{ width: '14px', height: '14px' }} />}>
            {user.steamUsername ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(102,192,244,0.1)', border: '1px solid rgba(102,192,244,0.25)' }}>
                  <Gamepad2 style={{ width: '15px', height: '15px', color: '#66C0F4' }} />
                </div>
                <div>
                  <p className="font-heading font-semibold text-white" style={{ fontSize: '14px' }}>{user.steamUsername}</p>
                  <p className="font-body text-[#22C55E]" style={{ fontSize: '11.5px' }}>Steam подключён</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-body text-[#6B7280] mb-3" style={{ fontSize: '13px' }}>
                  Подключите Steam для автоматической доставки игр в библиотеку.
                </p>
                <button
                  onClick={connectSteam}
                  className="inline-flex items-center gap-2 rounded-xl font-heading font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #1b2838, #66C0F4)',
                    padding: '10px 20px',
                    fontSize: '13px',
                  }}
                >
                  <Gamepad2 style={{ width: '14px', height: '14px' }} />
                  Войти через Steam
                </button>
              </div>
            )}
          </Section>

          {/* Notifications */}
          <Section title="Уведомления" icon={<Bell style={{ width: '14px', height: '14px' }} />}>
            <div className="space-y-4">
              {[
                { label: 'Email-уведомления', sub: 'Заказы, ключи, Arcane Coins', val: notifEmail, set: () => setNotifEmail(!notifEmail) },
                { label: 'Telegram-уведомления', sub: 'Снижение цен, акции, новинки', val: notifTg, set: () => setNotifTg(!notifTg) },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-medium text-[#9CA3AF]" style={{ fontSize: '13.5px' }}>{n.label}</p>
                    <p className="font-body text-[#374151]" style={{ fontSize: '11.5px' }}>{n.sub}</p>
                  </div>
                  <Toggle value={n.val} onChange={n.set} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
