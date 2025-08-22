import React from "react";

export const JobsTable: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <p className="text-neutral-400 text-center py-8">No jobs found</p>
      </div>
    </div>
  );
}; 