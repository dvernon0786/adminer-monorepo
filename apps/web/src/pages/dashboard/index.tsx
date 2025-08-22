import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { DashboardHeader } from "@/components/dashboard";
import EnhancedAnalysisForm from "@/components/dashboard/EnhancedAnalysisForm";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { ResultsTabs } from "@/components/dashboard/ResultsTabs";
import { useMemo, useState } from "react";
import { AnalysisResult, DashboardStats } from "@/types/dashboard";
import CodeEditorModal from "@/components/dashboard/CodeEditorModal";
import PricingModal from "@/components/dashboard/PricingModal";
import BootstrapFree from "@/components/BootstrapFree";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"filtering" | "today" | "all">("filtering");
  const [searchTerm, setSearchTerm] = useState("");
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selected, setSelected] = useState<AnalysisResult | null>(null);
  const [openPricing, setOpenPricing] = useState(false);

  const stats: DashboardStats = useMemo(() => {
    const images = analyses.filter(a => a.contentType === "image").length;
    const videos = analyses.filter(a => a.contentType === "video").length;
    const text   = analyses.filter(a => a.contentType === "text").length;
    const errors = analyses.filter(a => a.analysisStatus === "error").length;
    return { total: analyses.length, images, videos, text, errors };
  }, [analyses]);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return analyses;
    return analyses.filter(a =>
      (a.pageName || "").toLowerCase().includes(t) ||
      (a.summary || "").toLowerCase().includes(t) ||
      a.adArchiveId.toLowerCase().includes(t)
    );
  }, [analyses, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-neutral-200">
      <BootstrapFree />
      <DashboardHeader backendStatus="connected" onOpenPricing={() => setOpenPricing(true)} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Signed out → hero sign-in gate */}
        <SignedOut>
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold">Sign in to analyze ads</h1>
            <p className="text-neutral-400">Run cross‑platform competitive analysis in minutes.</p>
            <SignInButton mode="modal">
              <button className="gradient-btn px-5 py-2 rounded-lg font-medium">Sign in</button>
            </SignInButton>
          </section>
        </SignedOut>

        {/* Signed in → full dashboard */}
        <SignedIn>
          {/* Hero: Analysis Form (homepage‑parity) */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8 relative">
            <div className="absolute left-0 right-0 top-0 h-0.5 gradient-underline rounded-t-2xl" />
            <EnhancedAnalysisForm
              onAnalysisStart={() => {}}
              isAnalysisRunning={false}
            />
          </section>

          {/* Results */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
            <ResultsTabs
              activeTab={activeTab}
              onTabChange={(v) => setActiveTab(v as any)}
              analyses={analyses}
              filteredAnalyses={filtered}
              stats={stats}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAnalysisClick={(a) => setSelected(a)}
            />
          </section>

          {/* Table view under cards */}
          <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
            <JobsTable />
          </section>
        </SignedIn>
      </main>

      {/* Modals */}
      <CodeEditorModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        analysis={selected}
        title="AI Analysis (Markdown)"
      />
      <PricingModal open={openPricing} onOpenChange={setOpenPricing} />
    </div>
  );
} 