import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { isProtectedPath } from "@/lib/isProtectedPath";

export default function SignInBanner() {
  const { isSignedIn } = useAuth();
  const { pathname, search } = useLocation();

  if (!isProtectedPath(pathname) || isSignedIn) return null;

  const next = encodeURIComponent(pathname + search);
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
        <span className="text-sm">
          You need to sign in to view this page.
        </span>
        <div className="flex gap-2">
          <Link
            className="rounded-md px-3 py-1.5 text-sm bg-amber-600 text-white hover:bg-amber-700"
            to={`/sign-in?next=${next}`}
          >
            Sign in
          </Link>
          <Link
            className="rounded-md px-3 py-1.5 text-sm border border-amber-600 text-amber-700 hover:bg-amber-100"
            to={`/sign-up?next=${next}`}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
} 