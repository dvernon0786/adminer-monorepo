import React from "react";
import { DashboardStats } from "@/types/dashboard";

interface StatisticsCardsProps {
  stats: DashboardStats;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  const cards = [
    { label: "Total", value: stats.total, color: "bg-blue-500/20 text-blue-400" },
    { label: "Images", value: stats.images, color: "bg-green-500/20 text-green-400" },
    { label: "Videos", value: stats.videos, color: "bg-purple-500/20 text-purple-400" },
    { label: "Text", value: stats.text, color: "bg-orange-500/20 text-orange-400" },
    { label: "Errors", value: stats.errors, color: "bg-red-500/20 text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
          <div className={`text-2xl font-bold mb-1 ${card.color}`}>{card.value}</div>
          <div className="text-sm text-neutral-400">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards; 