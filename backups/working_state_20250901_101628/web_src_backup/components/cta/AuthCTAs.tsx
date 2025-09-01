import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { SignInBtn, SignUpBtn } from "../auth/ClerkButtons";

export function AuthCTAs() {
  return (
    <div className="flex gap-3">
      <SignedOut>
        <SignInBtn />
        <SignUpBtn />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
} 