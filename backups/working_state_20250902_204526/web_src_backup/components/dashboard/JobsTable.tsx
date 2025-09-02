// apps/web/src/components/dashboard/JobsTable.tsx
import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: string;
  keyword: string;
  adsRequested?: number | null;
  adsImported?: number | null;
  contentType: string | null;
  pageName: string | null;
  summary: string | null;
  rewrittenAdCopy: string | null;
  keyInsights: string[] | null;
  competitorStrategy: string | null;
  recommendations: string[] | null;
  imagePrompt: any | null;
  videoPrompt: any | null;
  createdAt: string;
};

export default function JobsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs/list", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setRows(d.items || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Analyses</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/60">Loading analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Analyses</h3>
        <div className="text-center py-8">
          <p className="text-red-400">Error loading analyses: {error}</p>
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Analyses</h3>
        <div className="text-center py-8">
          <p className="text-white/60">No analyses yet. Start your first job above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <h3 className="text-lg font-semibold mb-3">Recent Analyses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Keyword</th>
              <th className="py-2 pr-4">Requested</th>
              <th className="py-2 pr-4">Imported</th>
              <th className="py-2 pr-4">Page</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Summary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 pr-4 text-white/80">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4 font-medium">{r.keyword}</td>
                <td className="py-2 pr-4 text-white/80">{r.adsRequested ?? "-"}</td>
                <td className="py-2 pr-4 text-white/80">{r.adsImported ?? "-"}</td>
                <td className="py-2 pr-4 text-white/70">
                  {r.pageName ?? "-"}
                </td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80">
                    {r.contentType ?? "text"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === "completed" ? "bg-green-500/20 text-green-400" :
                    r.status === "running" ? "bg-blue-500/20 text-blue-400" :
                    r.status === "failed" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-white/70 max-w-xs">
                  {r.summary ? (
                    <div className="truncate" title={r.summary}>
                      {r.summary.slice(0, 100)}...
                    </div>
                  ) : (
                    "-"
                  )}
                  {r.videoPrompt?.skipped && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        Video skipped ({r.videoPrompt.reason})
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 