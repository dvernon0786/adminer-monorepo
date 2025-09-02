// apps/web/src/components/dashboard/StartJobForm.tsx
import { useState } from "react";
import { useStartJob } from "@/hooks/useJobs";

export default function StartJobForm() {
  const [keyword, setKeyword] = useState("");
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState<number | "">("");
  const { start, loading, error } = useStartJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (typeof limit !== "number" || limit < 1) return;

    try {
      // Parse additional parameters with better error handling
      let additionalParams = {};
      if (input.trim()) {
        try {
          additionalParams = JSON.parse(input);
        } catch (parseError) {
          console.error("Invalid JSON input:", parseError);
          // Show user-friendly error for JSON parse issues
          alert("Invalid JSON format in Additional Parameters. Please check your input and try again.");
          return;
        }
      }
      
      await start(keyword.trim(), { ...additionalParams, limit });
      setKeyword("");
      setInput("");
      setLimit("");
    } catch (error) {
      console.error("Job creation error:", error);
      // Error handling is already done in the useStartJob hook
    }
  };

  return (
    <div className="rounded-2xl p-6 border shadow-sm bg-white">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Start a New Analysis
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
            Keyword to Analyze
          </label>
          <input
            id="keyword"
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter keyword (e.g., 'Nike running shoes')"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Ads to Scrape
          </label>
          <input
            id="limit"
            type="number"
            min={1}
            max={2000}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter number of ads (e.g., 200)"
            value={limit}
            onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Free: max 10 per keyword • Pro: up to 500/month • Enterprise: up to 2000/month. 
            Backend will cap to your remaining quota automatically.
          </p>
        </div>

        <div>
          <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Parameters (Optional)
          </label>
          <textarea
            id="input"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder='{"priority": "high", "country": "US"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Valid JSON format for additional Apify parameters
          </p>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading || !keyword.trim() || typeof limit !== "number" || limit < 1}
        >
          {loading ? "Starting Analysis..." : "Start Analysis"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Each analysis consumes <em>ads</em> from your quota (not 1 job). 
          The backend will cap your request to your remaining quota.
        </p>
      </div>
    </div>
  );
} 