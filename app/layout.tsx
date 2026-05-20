import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, Press_Start_2P } from 'next/font/google';
import './globals.css';
import InitialLoader from '@/components/ui/loaders/InitialLoader';
import Providers from '@/app/providers';
import ConditionalLayout from '@/app/ConditionalLayout';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const pressStart = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'ARCANE.UZ — Премиальный магазин игр',
  description: 'Цифровые игры для PC, PS5 и Xbox по лучшим ценам в Узбекистане. Мгновенная доставка ключей, Mystery Cases и Arcane Coins.',
  keywords: ['игры', 'цифровые игры', 'PC игры', 'PS5', 'Xbox', 'Узбекистан', 'arcane uz'],
  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple:    '/logo-mark.svg',
    other: [{ rel: 'mask-icon', url: '/favicon.svg', color: '#7C3AED' }],
  },
  openGraph: {
    title: 'ARCANE.UZ — Премиальный магазин игр',
    description: 'Цифровые игры по лучшим ценам в Узбекистане',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#7C3AED' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${spaceGrotesk.variable} ${inter.variable} ${pressStart.variable}`}>
      <body className="bg-[#0A0A0F] text-white font-body antialiased">
        <Providers>
          <InitialLoader />
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
