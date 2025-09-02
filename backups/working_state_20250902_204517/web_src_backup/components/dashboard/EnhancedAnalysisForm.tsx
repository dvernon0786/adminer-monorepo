import React from "react";

interface EnhancedAnalysisFormProps {
  onAnalysisStart: () => void;
  isAnalysisRunning: boolean;
}

const EnhancedAnalysisForm: React.FC<EnhancedAnalysisFormProps> = ({
  onAnalysisStart,
  isAnalysisRunning
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl relative">
      {/* homepage‑parity gradient accent */}
      <div className="absolute left-0 right-0 top-0 h-0.5 gradient-underline rounded-t-2xl" />
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Keyword Analysis</h2>
          <p className="text-neutral-400 mb-4">
            Enter keywords to analyze Facebook ads and get competitive intelligence
          </p>
          <button
            onClick={onAnalysisStart}
            disabled={isAnalysisRunning}
            className="gradient-btn px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isAnalysisRunning ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalysisForm; 