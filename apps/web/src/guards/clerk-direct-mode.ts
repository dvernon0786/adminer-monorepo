/**
 * Build-time guard to ensure we never ship proxy/override config for Clerk.
 * Import this once in main.tsx.
 */
const forbiddenEnvKeys = [
  'CLERK_FRONTEND_API',
  'CLERK_PROXY_URL',
  'CLERK_JS_URL',
]

for (const k of forbiddenEnvKeys) {
  if ((import.meta as any).env?.[k]) {
    throw new Error(`[direct-mode] Forbidden env present: ${k}`)
  }
}

// Also check window.ENV at runtime (harmless in SSR/build).
if (typeof window !== 'undefined' && window.ENV) {
  const anyBad = forbiddenEnvKeys.find(k => (window as any).ENV[k])
  if (anyBad) throw new Error(`[direct-mode] Forbidden window.ENV key present: ${anyBad}`)
}

export {} 