import { useEffect, useState } from "react";

export function QuotaBadge({ onClickPricing }: { onClickPricing?: () => void }) {
  const [data, setData] = useState<null | {
    plan: { key: "free"|"pro"|"enterprise"|string; name: string };
    usage: { adsImported: number; month: string };
    limit: { monthlyCap: number | null; perRequestCap: number };
    remaining: number;
    resetDate?: string;
  }>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/consolidated?action=quota/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (mounted) setData(d); })
      .catch(e => { if (mounted) setErr(e.message); });
    return () => { mounted = false; };
  }, []);

  if (err) return <div className="text-red-500 text-sm">Quota: {err}</div>;
  if (!data) return <div className="text-neutral-400 text-sm">Loading quota…</div>;

  const used = data.usage.adsImported;
  const cap = data.limit.monthlyCap ?? Infinity;
  const pct = Math.min(100, Math.round((used / (cap === 0 ? 1 : cap)) * 100));
  const bar = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : pct >= 50 ? "bg-orange-500" : "bg-blue-500";
  const isLow = pct >= 75 && Number.isFinite(cap);

  return (
    <button
      onClick={onClickPricing}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border shadow-sm transition-colors ${
        isLow ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'border-white/15 bg-white/5 hover:bg-white/10'
      }`}
      title={`Per request max: ${data.limit.perRequestCap}${data.resetDate ? ` • Resets ${new Date(data.resetDate).toLocaleDateString()}` : ''}`}
    >
      <span className="font-medium">{data.plan.name}</span>
      <span className="text-sm text-neutral-400">
        {Number.isFinite(cap) ? `${used}/${cap}` : `${used} used`}
      </span>
      <span className="w-24 h-2 rounded bg-neutral-800 overflow-hidden">
        <span className={`block h-full ${bar}`} style={{ width: `${pct}%` }} />
      </span>
      {isLow && <span className="text-xs">⚠️</span>}
    </button>
  );
}

export default QuotaBadge; 