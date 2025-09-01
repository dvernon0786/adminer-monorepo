import React from "react";
import { AnalysisResult } from "@/types/dashboard";

interface AnalysisGridProps {
  analyses: AnalysisResult[];
  onAnalysisClick: (analysis: AnalysisResult) => void;
}

const AnalysisGrid: React.FC<AnalysisGridProps> = ({ analyses, onAnalysisClick }) => {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-400">No analyses found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyses.map((analysis) => (
        <div
          key={analysis.id}
          onClick={() => onAnalysisClick(analysis)}
          className="bg-white/5 rounded-lg p-4 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-400">{analysis.contentType}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              analysis.analysisStatus === "completed" ? "bg-green-500/20 text-green-400" :
              analysis.analysisStatus === "error" ? "bg-red-500/20 text-red-400" :
              "bg-yellow-500/20 text-yellow-400"
            }`}>
              {analysis.analysisStatus}
            </span>
          </div>
          <h4 className="font-medium mb-1">{analysis.pageName || "Unknown Page"}</h4>
          <p className="text-sm text-neutral-400">{analysis.adArchiveId}</p>
        </div>
      ))}
    </div>
  );
};

export default AnalysisGrid; 