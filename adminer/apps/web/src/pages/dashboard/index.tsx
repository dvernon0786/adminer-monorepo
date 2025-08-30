import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();



  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-neutral-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // TEMPORARY: Simplified dashboard to isolate the issue
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-neutral-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Please sign in</h1>
          <p className="text-neutral-400">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-neutral-200">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center space-y-3">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-neutral-400">Welcome to your dashboard!</p>
          <p className="text-sm text-neutral-500">This is a simplified version to test functionality.</p>
        </section>
      </main>
    </div>
  );
} 