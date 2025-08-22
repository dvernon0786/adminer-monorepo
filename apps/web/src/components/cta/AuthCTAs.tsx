import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

export function AuthCTAs() {
  return (
    <div className="flex gap-3">
      <SignedOut>
        <SignInButton mode="modal" asChild>
          <button className="btn btn-primary">Sign in</button>
        </SignInButton>
        <SignUpButton mode="modal" asChild>
          <button className="btn btn-secondary">Create account</button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
} 