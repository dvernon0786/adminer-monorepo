// apps/web/src/components/dashboard/StartJobForm.tsx
import { useState } from "react";
import { useStartJob } from "@/hooks/useJobs";
import { CountryOnlySelector } from "@/components/ui/country-only-selector";
import { AdCountSelector } from "@/components/ui/ad-count-selector";

export default function StartJobForm() {
  const [keyword, setKeyword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [limit, setLimit] = useState<number | "">("");
  const { start, loading, error } = useStartJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (typeof limit !== "number" || limit < 1) return;

    try {
      // Build additional parameters from country selection
      const additionalParams: any = {};
      if (selectedCountry) {
        additionalParams.country = selectedCountry;
      }
      
      await start(keyword.trim(), { ...additionalParams, limit });
      setKeyword("");
      setSelectedCountry("");
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
          <CountryOnlySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            disabled={loading}
          />
        </div>

        <div>
          <AdCountSelector
            selectedCount={limit}
            onCountChange={setLimit}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Free: max 10 per keyword • Pro: up to 500/month • Enterprise: up to 2000/month. 
            Backend will cap to your remaining quota automatically.
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