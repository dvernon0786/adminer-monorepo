declare global {
  interface Window {
    ENV?: {
      CLERK_FRONTEND_API?: string;
      CLERK_PROXY_URL?: string;
      CLERK_PUBLISHABLE_KEY?: string;
    };
  }
}

declare global {
  interface ImportMeta {
    env: {
      DEV?: boolean;
      PROD?: boolean;
      MODE?: string;
      VITE_CLERK_PUBLISHABLE_KEY?: string;
    };
  }
}

export {}; 