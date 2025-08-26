[08:02:18.754] Running build in Washington, D.C., USA (East) – iad1
[08:02:18.754] Build machine configuration: 2 cores, 8 GB
[08:02:18.788] Cloning github.com/dvernon0786/adminer-monorepo (Branch: main, Commit: f2efe95)
[08:02:18.966] Previous build caches not available
[08:02:19.399] Cloning completed: 610.000ms
[08:02:19.769] Running "vercel build"
[08:02:20.171] Vercel CLI 46.0.3
[08:02:20.494] Warning: Detected "engines": { "node": ">=20.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
[08:02:20.511] Installing dependencies...
[08:02:24.437] npm warn deprecated serialize-error-cjs@0.1.4: Rolling release, please update to 0.2.0
[08:02:24.637] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[08:02:25.368] npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
[08:02:26.281] npm warn deprecated @esbuild-kit/core-utils@3.3.2: Merged into tsx: https://tsx.is
[08:02:26.348] npm warn deprecated @esbuild-kit/esm-loader@2.6.5: Merged into tsx: https://tsx.is
[08:02:26.784] npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
[08:02:39.040] 
[08:02:39.041] added 441 packages in 17s
[08:02:39.042] 
[08:02:39.042] 42 packages are looking for funding
[08:02:39.042]   run `npm fund` for details
[08:02:39.198] Detected Next.js version: 14.2.10
[08:02:39.198] Running "bash ../../scripts/vercel-build.sh"
[08:02:39.202] bash: ../../scripts/vercel-build.sh: No such file or directory
[08:02:39.209] Error: Command "bash ../../scripts/vercel-build.sh" exited with 127    secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return res
  } catch (error) {
    console.error('Middleware: Emergency fallback response')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const config = {
  matcher: [
    // run on API + app routes; skip static/runtime
    '/((?!_next|static|clerk-runtime|vendor|assets|.*\\.(?:js|css|map|png|jpg|svg|ico|txt)$).*)',
    '/api/:path*',
  ],
} 