import React from "react";
import { Badge } from "../ui/badge";

interface QuotaBadgeProps {
  onClickPricing?: () => void;
  quota?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export function QuotaBadge({ onClickPricing, quota }: QuotaBadgeProps) {
  if (!quota) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-slate-600/30 bg-slate-800/50 text-slate-400 text-sm">
        <div className="animate-pulse w-4 h-4 bg-slate-600 rounded-full" />
        <span>Loading quota…</span>
      </div>
    );
  }

  const { used, limit, percentage } = quota;
  const pct = Math.min(100, Math.round((used / (limit === 0 ? 1 : limit)) * 100));
  
  const getStatusConfig = () => {
    if (pct >= 90) {
      return {
        barColor: "bg-red-500",
        borderColor: "border-red-500/40",
        bgColor: "bg-red-500/10",
        textColor: "text-red-400",
        icon: "🚨",
        label: "Critical"
      };
    } else if (pct >= 75) {
      return {
        barColor: "bg-amber-500",
        borderColor: "border-amber-500/40",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-400",
        icon: "⚠️",
        label: "Low"
      };
    } else {
      return {
        barColor: "bg-green-500",
        borderColor: "border-green-500/40",
        bgColor: "bg-green-500/10",
        textColor: "text-green-400",
        icon: "✅",
        label: "Good"
      };
    }
  };

  const status = getStatusConfig();

  return (
    <button
      onClick={onClickPricing}
      className={`group inline-flex items-center gap-3 rounded-full px-4 py-2 border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${status.borderColor} ${status.bgColor} hover:bg-opacity-20`}
      title={`Current usage: ${used.toLocaleString()}/${limit.toLocaleString()} (${pct}%)`}
    >
      {/* Status Icon */}
      <span className="text-lg group-hover:scale-110 transition-transform duration-300">
        {status.icon}
      </span>

      {/* Plan Label */}
      <div className="text-left">
        <p className="font-semibold text-white text-sm">Free Plan</p>
        <p className="text-xs text-slate-300">{status.label}</p>
      </div>

      {/* Usage Numbers */}
      <div className="text-right">
        <p className="text-white font-medium text-sm">
          {used.toLocaleString()}/{limit.toLocaleString()}
        </p>
        <p className={`text-xs font-semibold ${status.textColor}`}>
          {pct}%
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-20 h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${status.barColor} shadow-sm`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Upgrade Indicator */}
      {pct >= 75 && (
        <Badge 
          variant="destructive" 
          className="text-xs animate-pulse"
        >
          Upgrade
        </Badge>
      )}
    </button>
  );
}

export default QuotaBadge; 