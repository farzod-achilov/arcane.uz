// Client-side helper — fire-and-forget quest completion
export async function completeQuest(questId: string): Promise<void> {
  fetch('/api/quests/daily/complete', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ questId }),
  }).catch(() => {});
}
