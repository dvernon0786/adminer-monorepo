declare global {
  interface Window {
    ENV?: {
      VITE_CLERK_PUBLISHABLE_KEY?: string;
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
      CLERK_PROXY_URL?: string;
      CLERK_JS_URL?: string;
      CLERK_PROXY_HOST?: string;
    };
  }
}

export {}; 