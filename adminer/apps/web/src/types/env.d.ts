declare global {
  interface Window {
    ENV?: {
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

declare const __VITE_CLERK_PUBLISHABLE_KEY__: string | undefined;

export {}; 