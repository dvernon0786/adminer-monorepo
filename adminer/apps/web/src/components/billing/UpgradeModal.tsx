"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Plan, QuotaStatus } from "@/hooks/useQuota";

export default function UpgradeModal({
  open,
  onOpenChange,
  quota,
  defaultPlan = "pro",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: QuotaStatus | null;
  defaultPlan?: Exclude<Plan, "free">; // "pro" | "enterprise"
}) {
  const [submitting, setSubmitting] = useState(false);
  const plan = defaultPlan;

  const startUpgrade = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      console.error("Failed to start checkout", err);
    } finally {
      setSubmitting(false);
    }
  };

  const usedPct = quota ? Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100)) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Upgrade for more capacity</DialogTitle>
          <DialogDescription>
            You've hit your plan limit. Upgrade to unlock a higher monthly quota and keep your workflow moving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {quota && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Usage</span>
                <span>
                  {quota.used} / {quota.limit}
                </span>
              </div>
              <Progress value={usedPct} />
            </div>
          )}

          <div className="rounded-2xl border p-4">
            <div className="font-medium">Pro Plan</div>
            <div className="text-sm text-muted-foreground">Up to 500 analyses/month + priority processing</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Not now
          </Button>
          <Button onClick={startUpgrade} disabled={submitting}>
            {submitting ? "Redirecting..." : "Upgrade to Pro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 