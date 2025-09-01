import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AnalysisGrid from "./AnalysisGrid";
import StatisticsCards from "./StatisticsCards";
import SearchAndFilter from "./SearchAndFilter";
import { AnalysisResult, DashboardStats } from "@/types/dashboard";

interface ResultsTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  analyses: AnalysisResult[];
  filteredAnalyses: AnalysisResult[];
  stats: DashboardStats;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAnalysisClick: (analysis: AnalysisResult) => void;
  className?: string;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({
  activeTab,
  onTabChange,
  analyses,
  filteredAnalyses,
  stats,
  searchTerm,
  onSearchChange,
  onAnalysisClick,
  className = "",
}) => {
  const today = new Date().toDateString();
  const todayCount = analyses.filter(a => new Date(a.createdAt).toDateString() === today).length;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className="w-full justify-start gap-2 bg-white/10 rounded-lg p-1">
        {["filtering", "today", "all"].map((t) => (
          <TabsTrigger
            key={t}
            value={t}
            className="relative data-[state=active]:text-white data-[state=active]:bg-transparent"
          >
            <span className="capitalize">
              {t === "today" ? `Today (${todayCount})` : t === "all" ? `All (${analyses.length})` : "Filtering"}
            </span>
            <span className="absolute left-2 right-2 -bottom-1.5 h-0.5 hidden data-[state=active]:block gradient-underline rounded" />
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="filtering" className="space-y-6 mt-6">
        <StatisticsCards stats={stats} />
        <SearchAndFilter searchTerm={searchTerm} onSearchChange={onSearchChange} />
        <AnalysisGrid analyses={filteredAnalyses} onAnalysisClick={onAnalysisClick} />
      </TabsContent>

      <TabsContent value="today" className="space-y-4 mt-6">
        <AnalysisGrid
          analyses={analyses.filter(a => new Date(a.createdAt).toDateString() === today)}
          onAnalysisClick={onAnalysisClick}
        />
      </TabsContent>

      <TabsContent value="all" className="space-y-4 mt-6">
        <AnalysisGrid analyses={analyses} onAnalysisClick={onAnalysisClick} />
      </TabsContent>
    </Tabs>
  );
};

export default ResultsTabs; 