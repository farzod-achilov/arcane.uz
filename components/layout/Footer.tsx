'use client';

import Link from 'next/link';
import { Send, Instagram } from 'lucide-react';
import LogoFull from '@/components/ui/LogoFull';
import { useDict } from '@/lib/locale/client';

export default function Footer() {
  const d = useDict();
  const fl = d.footer.links;
  const year = new Date().getFullYear();

  const links = {
    catalog: [
      { label: fl.pcGames,   href: '/catalog?platform=PC' },
      { label: fl.ps5Games,  href: '/catalog?platform=PS5' },
      { label: fl.xboxGames, href: '/catalog?platform=Xbox' },
      { label: fl.deals,     href: '/catalog?filter=deals' },
      { label: fl.new,       href: '/catalog?filter=new' },
    ],
    info: [
      { label: fl.about,       href: '/about' },
      { label: fl.keyDelivery, href: '/faq' },
      { label: fl.returns,     href: '/terms' },
      { label: fl.coins,       href: '/#arcane-coins' },
      { label: fl.partner,     href: '/support' },
    ],
    support: [
      { label: fl.tgSupport, href: 'https://t.me/arcaneuz_support' },
      { label: fl.faq,       href: '/faq' },
      { label: fl.howToPay,  href: '/faq' },
      { label: fl.contact,   href: '/support' },
    ],
  };

  const socials = [
    { icon: Send,      href: 'https://t.me/arcaneuz_support',           label: 'Telegram'  },
    { icon: Instagram, href: 'https://www.instagram.com/arcanecomuz',   label: 'Instagram' },
  ];

  const paymentMethods = ['Payme', 'Click', 'Uzum', 'Visa', 'MC'];

  return (
    <footer className="bg-[#09090E]">
      {/* Top gradient glow line */}
      <div
        className="h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.35) 25%, rgba(124,58,237,0.55) 50%, rgba(6,182,212,0.28) 75%, transparent 100%)',
        }}
      />

      {/* Subtle top ambient glow */}
      <div
        className="relative"
        style={{
          background:
            'radial-gradient(ellipse 70% 160px at 50% 0%, rgba(124,58,237,0.045) 0%, transparent 100%)',
        }}
      >
        {/* ══════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

            {/* ── BRAND ── */}
            <div className="lg:col-span-2 flex flex-col items-center lg:items-start">
              <Link href="/" className="group mb-5 inline-block">
                <div className="transition-transform duration-300 group-hover:scale-[1.03] drop-shadow-[0_0_10px_rgba(124,58,237,0.35)]">
                  <LogoFull width={140} height={168} />
                </div>
              </Link>

              <p
                className="font-body leading-relaxed max-w-[260px] mb-7 text-center lg:text-left text-[#6B7280]"
                style={{ fontSize: '13.5px', lineHeight: '1.7' }}
              >
                {d.footer.brandDesc}
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="group/s w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 bg-[#0D0D16] border border-white/[0.06] hover:border-[#7C3AED]/40 hover:shadow-[0_0_14px_rgba(124,58,237,0.18)]"
                  >
                    <s.icon className="w-[15px] h-[15px] text-[#6B7280] group-hover/s:text-[#9D60FA] transition-colors duration-200" />
                  </a>
                ))}
              </div>
            </div>

            {/* ── CATALOG ── */}
            <div>
              <FooterColumnTitle>{d.footer.colCatalog}</FooterColumnTitle>
              <ul className="space-y-3">
                {links.catalog.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="group/link inline-flex items-center gap-2">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0 bg-[#7C3AED] opacity-0 group-hover/link:opacity-100 transition-opacity duration-200"
                        style={{ boxShadow: '0 0 5px rgba(124,58,237,0.8)' }}
                      />
                      <span
                        className="font-body text-[#6B7280] group-hover/link:text-[#D1D5DB] transition-colors duration-200"
                        style={{ fontSize: '13.5px' }}
                      >
                        {l.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── INFO ── */}
            <div>
              <FooterColumnTitle>{d.footer.colInfo}</FooterColumnTitle>
              <ul className="space-y-3">
                {links.info.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="group/link inline-flex items-center gap-2">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0 bg-[#7C3AED] opacity-0 group-hover/link:opacity-100 transition-opacity duration-200"
                        style={{ boxShadow: '0 0 5px rgba(124,58,237,0.8)' }}
                      />
                      <span
                        className="font-body text-[#6B7280] group-hover/link:text-[#D1D5DB] transition-colors duration-200"
                        style={{ fontSize: '13.5px' }}
                      >
                        {l.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── SUPPORT + PAYMENT ── */}
            <div>
              <FooterColumnTitle>{d.footer.colSupport}</FooterColumnTitle>
              <ul className="space-y-3 mb-8">
                {links.support.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="group/link inline-flex items-center gap-2"
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0 bg-[#06B6D4] opacity-0 group-hover/link:opacity-100 transition-opacity duration-200"
                        style={{ boxShadow: '0 0 5px rgba(6,182,212,0.8)' }}
                      />
                      <span
                        className="font-body text-[#6B7280] group-hover/link:text-[#D1D5DB] transition-colors duration-200"
                        style={{ fontSize: '13.5px' }}
                      >
                        {l.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Payment methods */}
              <div>
                <p
                  className="font-body text-[#374151] mb-3"
                  style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {d.footer.paymentMethods}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm}
                      className="px-2.5 py-1 rounded-lg font-body text-[#4B5563] bg-[#0D0D16] border border-white/[0.05]"
                      style={{ fontSize: '11px' }}
                    >
                      {pm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BOTTOM BAR
        ══════════════════════════════════════════ */}
        <div className="border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
              © {year}&nbsp;ARCANE.UZ — {d.footer.rights}
            </p>

            <div className="flex items-center gap-0">
              <Link
                href="/privacy"
                className="font-body text-[#374151] hover:text-[#6B7280] transition-colors duration-200"
                style={{ fontSize: '12px' }}
              >
                {d.footer.privacy}
              </Link>
              <span className="mx-3 text-[#1F2937]" aria-hidden="true">·</span>
              <Link
                href="/terms"
                className="font-body text-[#374151] hover:text-[#6B7280] transition-colors duration-200"
                style={{ fontSize: '12px' }}
              >
                {d.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span
        className="w-[3px] h-4 rounded-full flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #7C3AED 0%, #06B6D4 100%)' }}
      />
      <h4
        className="font-heading font-semibold text-[#9CA3AF]"
        style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {children}
      </h4>
    </div>
  );
}
