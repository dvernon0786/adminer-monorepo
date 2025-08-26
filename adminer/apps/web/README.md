# Adminer Web App

This is the frontend web application for Adminer, built with React + Vite.

## Environment Setup

1. Copy `env.production.template` to `.env.local`
2. Set your environment variables:
   - `CLERK_FRONTEND_API`: Your Clerk custom domain (e.g., `clerk.adminer.online`)
3. Get your Clerk configuration from [clerk.com](https://clerk.com)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Keyless Authentication

This app uses Clerk's keyless mode with a custom domain. No publishable keys are required. 