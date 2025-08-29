import { useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { isProtectedPath } from "@/lib/isProtectedPath";

export default function SignInBanner() {
  const { pathname } = useLocation();
  const { isSignedIn } = useAuth();

  // Show the banner ONLY if path is protected AND user is signed out
  if (!isProtectedPath(pathname) || isSignedIn) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 text-white flex items-start justify-center">
      <div className="mt-6 rounded-xl bg-white text-black p-4 shadow-xl max-w-md w-full">
        <b>Sign In Required</b>
        <p className="mt-1">Please sign in to view your dashboard and quota information.</p>
      </div>
    </div>
  );
} 