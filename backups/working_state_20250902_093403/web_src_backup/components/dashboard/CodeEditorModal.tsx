import React from "react";
import { AnalysisResult } from "@/types/dashboard";

interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  title: string;
}

const CodeEditorModal: React.FC<CodeEditorModalProps> = ({ isOpen, onClose, analysis, title }) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0F172A] text-neutral-200 shadow-lg">
        {/* Gradient Header */}
        <div className="h-2 w-full gradient-underline rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <p className="text-neutral-400">Analysis content would be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorModal; 