"use client";

import { useState } from "react";
import UpgradeModal from "./UpgradeModal";
import { useQuota } from "@/hooks/useQuota";
import { apiFetch } from "@/lib/apiFetch";

export function StartAnalysisButton() {
  const { data: quota, refresh } = useQuota();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const startJob = async () => {
    try {
      const res = await apiFetch("/api/jobs", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (err: any) {
      if (err?.message === "QUOTA_EXCEEDED") {
        setUpgradeOpen(true);
      } else {
        console.error(err);
      }
    }
  };

  return (
    <>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        onClick={startJob}
        disabled={quota?.overLimit}
      >
        Start Analysis
      </button>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} quota={quota} />
    </>
  );
}

export function QuotaDisplay() {
  const { data: quota, loading, error } = useQuota();

  if (loading) return <div>Loading quota...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!quota) return <div>No quota data</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Current Usage</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Plan:</span>
          <span className="capitalize">{quota.plan}</span>
        </div>
        <div className="flex justify-between">
          <span>Used:</span>
          <span>{quota.used} / {quota.limit}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining:</span>
          <span>{quota.remaining}</span>
        </div>
      </div>
    </div>
  );
} 