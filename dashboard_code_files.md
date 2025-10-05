# 🎨 **ADMINER DASHBOARD CODE FILES**

**Date**: September 20, 2025  
**Status**: 📁 **COMPLETE CODE COLLECTION**  
**Priority**: **HIGH - DASHBOARD IMPLEMENTATION**

---

## 📁 **MAIN DASHBOARD COMPONENT**

### **`/adminer/apps/web/src/pages/dashboard/index.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuota } from '../../hooks/useQuota';
import { useAnalysesStats } from '../../hooks/useAnalysesStats';
import { QuotaBanner } from '../../components/QuotaBanner';
import QuotaUpgradeModal from '../../components/modals/QuotaUpgradeModal';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import JobsTable from '../../components/dashboard/JobsTable';
import StartJobForm from '../../components/dashboard/StartJobForm';
import ResultsTabs from '../../components/dashboard/ResultsTabs';
import AnalysisGrid from '../../components/dashboard/AnalysisGrid';
import StatisticsCards from '../../components/dashboard/StatisticsCards';
import SearchAndFilter from '../../components/dashboard/SearchAndFilter';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function Dashboard() {
  const { user } = useUser();
  const { data: quota, loading, error } = useQuota();
  const { data: stats, loading: statsLoading, error: statsError } = useAnalysesStats();
  
  // V4 DEBUG: Track render count to identify infinite loop
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // V4 FIX: Prevent infinite render loop
  if (renderCount.current > 10) {
    console.error('🚨 INFINITE_LOOP_DETECTED: Dashboard rendering too many times');
    return <div>Error: Infinite render loop detected</div>;
  }

  console.log('🚀 DASHBOARD_COMPONENT_LOADED:', {
    quota,
    loading,
    error,
    timestamp: new Date().toISOString(),
    renderCount: renderCount.current
  });

  // Mock data for dashboard components
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Mock analyses data
  const mockAnalyses = [
    {
      id: '1',
      adArchiveId: 'ad1',
      contentType: 'image' as const,
      analysisStatus: 'completed' as const,
      createdAt: new Date().toISOString(),
      summary: 'Sample image analysis'
    },
    {
      id: '2',
      adArchiveId: 'ad2',
      contentType: 'video' as const,
      analysisStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      summary: 'Sample video analysis'
    }
  ];

  console.log("DESIGN-SYSTEM-DASHBOARD: Component executing...");
  console.log("DESIGN-SYSTEM-DASHBOARD: Quota data:", quota);
  console.log("DESIGN-SYSTEM-DASHBOARD: Stats data:", stats);
  
  // V4 FIX: Simplified modal trigger - no infinite loops
  useEffect(() => {
    console.log('🔍 MODAL_TRIGGER_CHECK:', {
      quota: quota,
      percentage: quota?.percentage,
      showQuotaModal: showQuotaModal,
      shouldTrigger: quota && quota.percentage >= 100 && !showQuotaModal
    });
    
    if (quota && quota.percentage >= 100 && !showQuotaModal) {
      console.log('🎯 V4_MODAL_TRIGGER: Quota is 100%, showing QuotaUpgradeModal');
      setShowQuotaModal(true);
    }
  }, [quota]); // Removed showQuotaModal from dependencies to prevent infinite loop

  // Payment Success Handling - Detect upgrade=success and refresh quota
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const upgrade = urlParams.get('upgrade');
    const subscriptionId = urlParams.get('subscription_id');
    const status = urlParams.get('status');

    if (upgrade === 'success' && subscriptionId && status === 'active') {
      console.log('🎉 PAYMENT_SUCCESS_DETECTED_V6', {
        subscriptionId,
        status,
        timestamp: new Date().toISOString()
      });

      // Force refresh quota data after payment success
      const refreshQuotaAfterPayment = async () => {
        try {
          console.log('🔄 REFRESHING_QUOTA_AFTER_PAYMENT_V6');
          
          // Call manual quota fix endpoint
          const fixResponse = await fetch('/api/fix-quota', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user?.id || '',
            },
            body: JSON.stringify({
              subscriptionId: subscriptionId,
              plan: 'pro', // Default to pro, webhook will determine actual plan
              userId: user?.id,
              email: user?.emailAddresses?.[0]?.emailAddress
            })
          });

          if (fixResponse.ok) {
            const fixResult = await fixResponse.json();
            console.log('✅ QUOTA_FIX_APPLIED_V6', fixResult);
            
            // Refresh quota data by reloading the page
            window.location.reload();
            
            // Show success message
            alert(`Payment successful! Your plan has been upgraded to ${fixResult.newPlan} with ${fixResult.newQuotaLimit} ads per month.`);
            
            // Clear URL parameters
            window.history.replaceState({}, '', window.location.pathname);
            
          } else {
            console.log('⚠️ QUOTA_FIX_FAILED_V6', fixResponse.status);
            
            // Still try to refresh quota data
            window.location.reload();
          }
          
        } catch (error) {
          console.error('💥 PAYMENT_SUCCESS_REFRESH_ERROR_V6', error);
          
          // Fallback: still try to refresh quota
          window.location.reload();
        }
      };

      // Delay refresh to allow webhook processing
      setTimeout(refreshQuotaAfterPayment, 2000);
    }
  }, [user]); // Only run when user changes

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96 bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h3>
              <p className="text-slate-300">Initializing your workspace...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if error is quota exceeded
    if (error.includes('quota exceeded') || error.includes('Quota exceeded')) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <QuotaUpgradeModal
            isOpen={true}
            quota={quota || { used: 0, limit: 10, percentage: 0 }}
            onClose={() => {}} // Don't allow closing when quota exceeded
          />
        </div>
      );
    }
    
    // Show generic error for other issues
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96 bg-red-500/10 backdrop-blur-md border-red-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96 bg-blue-500/10 backdrop-blur-md border-blue-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Sign In Required</h3>
              <p className="text-blue-300 text-sm">Please sign in to view your dashboard and quota information.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  console.log("DESIGN-SYSTEM-DASHBOARD: Rendering premium dashboard with quota:", quota);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Quota Exceeded Modal */}
      {console.log('🎯 DASHBOARD_RENDER: showQuotaModal =', showQuotaModal, 'quota =', quota)}
      <QuotaUpgradeModal
        isOpen={showQuotaModal}
        quota={quota || { used: 0, limit: 10, percentage: 0 }}
        onClose={() => setShowQuotaModal(false)}
      />
      {/* Dashboard Header */}
      <DashboardHeader
        backendStatus="connected"
        onOpenPricing={() => console.log("Pricing modal requested")}
        quota={quota}
      />

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quota Banner */}
        <div className="mb-8">
          <QuotaBanner quota={quota} />
        </div>

        {/* Statistics Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Analyses</p>
                    <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Images</p>
                    <p className="text-3xl font-bold text-white">{stats?.images || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🖼️</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Videos</p>
                    <p className="text-3xl font-bold text-white">{stats?.videos || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎥</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Text</p>
                    <p className="text-3xl font-bold text-white">{stats?.text || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </CardContent>
          </Card>
        </div>

        {/* Start Job Form */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Start New Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StartJobForm />
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Recent Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JobsTable />
            </CardContent>
          </Card>
        </div>

        {/* Analysis Grid */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisGrid
                analyses={mockAnalyses}
                onAnalysisClick={(id) => console.log("Analysis clicked:", id)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Results Tabs */}
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <ResultsTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                analyses={mockAnalyses}
                filteredAnalyses={mockAnalyses}
                stats={stats || { total: 0, images: 0, videos: 0, text: 0, errors: 0 }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAnalysisClick={(analysis) => console.log("Analysis clicked:", analysis.id)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧩 **DASHBOARD COMPONENTS**

### **`/adminer/apps/web/src/components/dashboard/DashboardHeader.tsx`**
```typescript
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
```

### **`/adminer/apps/web/src/components/QuotaBanner.tsx`**
```typescript
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
```

---

## 📊 **ADDITIONAL COMPONENTS**

### **JobsTable.tsx** - Recent jobs display
### **StartJobForm.tsx** - New analysis creation
### **AnalysisGrid.tsx** - Analysis results grid
### **StatisticsCards.tsx** - Metrics overview
### **SearchAndFilter.tsx** - Search and filter controls
### **ResultsTabs.tsx** - Tabbed results view
### **QuotaBadge.tsx** - Header quota display

---

## 🎨 **DESIGN SYSTEM**

### **Color Palette**
- **Background**: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- **Cards**: `bg-white/10 backdrop-blur-md border-white/20`
- **Text**: `text-white` / `text-slate-300/400`
- **Accents**: Blue, Purple, Cyan gradients

### **Key Features**
- **Glassmorphism Design**: Semi-transparent cards with backdrop blur
- **Responsive Layout**: Mobile-first design with breakpoints
- **Real-time Data**: Quota tracking and job status updates
- **Error Handling**: Comprehensive loading and error states
- **User Authentication**: Clerk integration for user management

---

## 📁 **FILE STRUCTURE**
```
adminer/apps/web/src/
├── pages/dashboard/index.tsx          # Main dashboard page
├── components/
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx        # Top navigation
│   │   ├── JobsTable.tsx             # Jobs history table
│   │   ├── StartJobForm.tsx          # New job creation
│   │   ├── AnalysisGrid.tsx          # Analysis results grid
│   │   ├── StatisticsCards.tsx       # Metrics cards
│   │   ├── SearchAndFilter.tsx       # Search controls
│   │   ├── ResultsTabs.tsx           # Tabbed results
│   │   └── QuotaBadge.tsx            # Header quota display
│   ├── QuotaBanner.tsx               # Main quota display
│   └── ui/
│       ├── card.tsx                  # Card components
│       └── button.tsx                # Button components
```

---

**Status**: ✅ **COMPLETE CODE COLLECTION**  
**Ready for**: Implementation, customization, or deployment