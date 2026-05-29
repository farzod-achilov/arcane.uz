'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function QuestTrigger({ questId }: { questId: string }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return; // только для залогиненных
    fetch('/api/quests/daily/complete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ questId }),
    })
      .then(r => r.json())
      .then((d: { ok?: boolean; reward?: number; alreadyDone?: boolean }) => {
        if (d.ok && !d.alreadyDone && d.reward) {
          toast.success(`+${d.reward} ARC Coins`, {
            description: `Задание выполнено! 🎯`,
            duration: 3000,
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return null;
}
