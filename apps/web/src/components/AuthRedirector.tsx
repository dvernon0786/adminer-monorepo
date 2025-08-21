import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

// Read a simple cookie (no external deps)
function hasServerGuardCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((v) => v.trim().startsWith("sg="));
}

const ONE_SHOT_KEY = "authredir:once";

export default function AuthRedirector() {
  const { isSignedIn } = useAuth();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // If middleware is active, client stays passive (no auto-redirect)
    if (hasServerGuardCookie()) return;

    // Local dev (no middleware): do at most ONE auto-redirect per tab session
    const once = sessionStorage.getItem(ONE_SHOT_KEY);
    if (once === "1") return;

    if (isSignedIn) {
      // Signed-in users landing on "/" get a one-time nudge to dashboard
      if (location.pathname === "/") {
        sessionStorage.setItem(ONE_SHOT_KEY, "1");
        location.replace("/dashboard");
      }
    }
  }, [isSignedIn]);

  // No UI; passive when sg cookie exists.
  return null;
} 