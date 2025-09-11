import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface QuotaBannerProps {
  quota: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export function QuotaBanner({ quota }: QuotaBannerProps) {
  const { used, limit, percentage } = quota;
  const remaining = limit - used;
  const isLow = percentage >= 75;
  const isCritical = percentage >= 90;

  const getStatusColor = () => {
    if (isCritical) return "text-red-400 border-red-500/30 bg-red-500/10";
    if (isLow) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-green-400 border-green-500/30 bg-green-500/10";
  };

  const getProgressColor = () => {
    if (isCritical) return "bg-red-500";
    if (isLow) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-md border-white/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
      <CardContent className="relative p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Side - Quota Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-semibold text-white">Quota Status</h2>
              <Badge 
                variant={isCritical ? "destructive" : isLow ? "secondary" : "default"}
                className="text-xs"
              >
                {isCritical ? "Critical" : isLow ? "Low" : "Good"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Used</p>
                <p className="text-2xl font-bold text-white">{used.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Remaining</p>
                <p className="text-2xl font-bold text-white">{remaining.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-white">{limit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right Side - Progress Bar */}
          <div className="flex-shrink-0 w-full lg:w-80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Usage Progress</span>
              <span className={`text-sm font-semibold ${getStatusColor()}`}>
                {percentage}%
              </span>
            </div>
            
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>0</span>
              <span>{limit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {isLow && (
          <div className={`mt-4 p-3 rounded-lg border ${getStatusColor()} bg-opacity-20`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {isCritical ? "🚨" : "⚠️"}
              </span>
              <p className="text-sm font-medium">
                {isCritical 
                  ? `You've used ${percentage}% of your quota. Consider upgrading to continue.`
                  : `You've used ${percentage}% of your quota. Consider monitoring usage.`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuotaBanner; 