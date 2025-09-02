import React from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { QuotaBadge } from "./QuotaBadge";
import { Badge } from "../ui/badge";

interface Props {
  className?: string;
  backendStatus?: "connected" | "disconnected" | "checking";
  onOpenPricing?: () => void;
  quota?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

const DashboardHeader: React.FC<Props> = ({ className = "", backendStatus = "checking", onOpenPricing, quota }) => {
  const { user } = useUser();

  const getStatusConfig = () => {
    switch (backendStatus) {
      case "connected":
        return {
          color: "bg-green-400",
          text: "Backend Connected",
          icon: "🟢"
        };
      case "disconnected":
        return {
          color: "bg-red-400",
          text: "Backend Disconnected",
          icon: "🔴"
        };
      default:
        return {
          color: "bg-yellow-400",
          text: "Checking Backend…",
          icon: "🟡"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <header className={`sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/20 shadow-2xl ${className}`}>
      {/* Gradient underline */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side - Brand & Status */}
        <div className="flex items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                ADminer
              </span>
            </span>
          </div>

          {/* Backend Status */}
          <div className="hidden md:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`} />
            <span className="text-sm text-slate-300">
              {statusConfig.icon} {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Right Side - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Quota Badge */}
          <div className="hidden sm:block">
            <QuotaBadge onClickPricing={onOpenPricing} quota={quota} />
          </div>

          {/* Pricing Button */}
          <Button 
            onClick={onOpenPricing} 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            💎 Pricing
          </Button>

          {/* User Info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">
                  {user?.firstName || "User"}
                </p>
                <p className="text-slate-400 text-xs">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <SignOutButton>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 