import { useEffect, useState } from "react";
import { useConsolidatedApi } from "../lib/useConsolidatedApi";

export function QuotaBadge({ onClickPricing }: { onClickPricing?: () => void }) {
  const { quotaStatus } = useConsolidatedApi();
  const [data, setData] = useState<{ plan: { name: string; monthlyAnalyses: number }, usage: { analyses: number }, resetDate?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    quotaStatus()
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setErr(e.message));
    return () => { mounted = false; };
  }, [quotaStatus]);

  if (err) return <div className="text-red-500 text-sm">Quota: {err}</div>;
  if (!data) return <div className="text-neutral-400 text-sm">Loading quota…</div>;

  const used = data.usage.analyses;
  const cap = data.plan.monthlyAnalyses;
  const pct = Math.min(100, Math.round((used / Math.max(1, cap)) * 100));
  const bar =
    pct >= 90 ? "bg-red-500" :
    pct >= 75 ? "bg-amber-500" :
    pct >= 50 ? "bg-orange-500" :
    "bg-blue-500";

  return (
    <button
      onClick={onClickPricing}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 border border-white/15 bg-white/5 shadow-sm hover:bg-white/10 transition-colors"
      title={`Resets ${data.resetDate ? new Date(data.resetDate).toLocaleDateString() : ""}`}
    >
      <span className="font-medium">{data.plan.name}</span>
      <span className="text-sm text-neutral-400">{used}/{cap}</span>
      <span className="w-24 h-2 rounded bg-neutral-800 overflow-hidden">
        <span className={`block h-full ${bar}`} style={{ width: `${pct}%` }} />
      </span>
    </button>
  );
} 