declare global {
  interface Window {
    ENV?: {
      CLERK_FRONTEND_API?: string;
      CLERK_PROXY_URL?: string;
    };
  }
}

declare global {
  interface ImportMeta {
    env: {
      DEV?: boolean;
      PROD?: boolean;
      MODE?: string;
    };
  }
}

export {}; 