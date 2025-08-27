export async function getQuota() {
  const res = await fetch('/api/consolidated?action=quota/status', { credentials: 'include' });
  if (res.status === 402) {
    const j = await res.json();
    return { ok: false, quotaExceeded: true, upgradeUrl: j.upgradeUrl ?? '/billing' };
  }
  if (!res.ok) throw new Error('quota fetch failed');
  return res.json();
} 