'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function Inner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const didRun  = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = params.get('token');
    if (!token) { router.replace('/login'); return; }

    let steamId: string;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
      steamId = decoded.steamId;
      // Check token freshness (5 min)
      if (!steamId || Date.now() - decoded.ts > 300_000) throw new Error('expired');
    } catch {
      router.replace('/login?error=steam');
      return;
    }

    signIn('steam', { steamId, redirect: false }).then(result => {
      if (result?.ok) router.replace('/library');
      else            router.replace('/login?error=steam');
    });
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#03020A' }}>
      <p className="font-heading text-white" style={{ fontSize: '16px' }}>Входим через Steam…</p>
    </div>
  );
}

export default function SteamSigninPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#03020A' }} />}>
      <Inner />
    </Suspense>
  );
}
