# ADminer Web Application

A React/TypeScript application for competitive ad intelligence across multiple platforms.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with:
```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

3. Get your Clerk publishable key from [clerk.com](https://clerk.com)

4. Run the development server:
```bash
npm run dev
```

## Features

- **Centralized Authentication**: Single AuthRedirector component handles all post-auth redirects
- **Keyword Analysis**: Form with comma-separated keyword support and validation
- **Country Selection**: Full country names (no ISO codes)
- **Platform Showcase**: Navigation to dashboard from "Try Now" buttons
- **Shader Background**: Animated background with proper cleanup
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Patches Applied

- ✅ Centralized post-auth redirect via AuthRedirector
- ✅ Country mismatch fix (full names end-to-end)
- ✅ Keyword validation & UX improvements
- ✅ PlatformShowcase "Try Now" navigation
- ✅ Shader background cleanup + accessibility
- ✅ Copy consistency (2–5 minutes)
- ✅ Typing safety improvements

## Project Structure

```
src/
├── components/
│   ├── AuthRedirector.tsx      # Centralized auth redirect
│   ├── navigation.tsx          # Navigation without redirects
│   ├── shader-background.tsx   # Animated background
│   ├── ui/                     # shadcn/ui components
│   └── homepage/               # Homepage components
├── pages/
│   └── Homepage.tsx            # Main homepage
├── lib/
│   └── utils.ts                # Utility functions
└── App.tsx                     # Main app with routing
```

## Dependencies

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router DOM
- Clerk Authentication
- React Hook Form + Zod validation
- Lucide React icons
- Sonner toast notifications 