import { useRouter } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

export function StartButtons() {
  const router = useRouter();

  return (
    <div className="flex gap-3">
      <SignedOut>
        <SignInButton mode="modal" asChild>
          <button className="btn btn-primary">Start Analysis</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/dashboard")}
        >
          Start Analysis
        </button>
        <button
          className="btn"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </button>
      </SignedIn>
    </div>
  );
} 