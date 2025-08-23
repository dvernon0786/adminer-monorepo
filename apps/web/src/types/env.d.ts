declare global {
  interface Window {
    ENV?: {
      CLERK_FRONTEND_API?: string;
    };
  }
}

export {}; 