import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { QuotaBadge } from "./QuotaBadge";

interface Props {
  className?: string;
  backendStatus?: "connected" | "disconnected" | "checking";
  onOpenPricing?: () => void;
}

const DashboardHeader: React.FC<Props> = ({ className = "", backendStatus = "checking", onOpenPricing }) => {
  const { user } = useAuth();

  const statusColor =
    backendStatus === "connected" ? "bg-green-400" :
    backendStatus === "disconnected" ? "bg-red-400" : "bg-yellow-400";

  return (
    <header className={`sticky top-0 z-40 bg-black/70 backdrop-blur-md border-b border-white/10 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold tracking-tight">
            <span className="gradient-text">ADminer</span>
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
            <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
            <span>
              {backendStatus === "connected" ? "Backend Connected" :
               backendStatus === "disconnected" ? "Backend Disconnected" : "Checking Backend…"}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <QuotaBadge onClickPricing={onOpenPricing} />
          </div>
          <button onClick={onOpenPricing} className="gradient-btn px-3 py-1.5 rounded-md text-sm font-medium">
            Pricing
          </button>
          <span className="hidden md:block text-sm text-neutral-300">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <SignOutButton>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
      <div className="gradient-underline h-0.5 w-full" />
    </header>
  );
};

export default DashboardHeader; 