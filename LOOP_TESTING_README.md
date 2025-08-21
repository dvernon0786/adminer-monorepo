# ADminer Loop Testing & Prevention System

This document describes the comprehensive system implemented to prevent and detect infinite redirect loops in the ADminer application.

## 🚨 What We're Preventing

Infinite redirect loops can occur when:
- Authentication middleware redirects users between protected and public routes
- Client-side auth guards conflict with server-side middleware
- Environment variables are missing or misconfigured
- Clerk authentication keys are invalid or missing

## 🛡️ Loop Prevention Measures

### 1. Server-Side Middleware (`apps/api/middleware.ts`)

**Key Features:**
- **Loop Guards**: Prevents redirects to the same path
- **API Protection**: Guards API routes without redirecting (returns 401/403)
- **Safe Redirects**: Only redirects when necessary and safe
- **Fallback Handling**: Gracefully handles auth failures

**Loop Prevention Logic:**
```typescript
const go = (targetPath: string) => {
  if (targetPath === here) {
    return NextResponse.next(); // Prevent redirect to same path
  }
  return NextResponse.redirect(new URL(targetPath, req.url));
};
```

### 2. Client-Side AuthRedirector (`apps/web/src/components/AuthRedirector.tsx`)

**Key Features:**
- **Loop Prevention**: Checks current path before redirecting
- **Conditional Logic**: Only redirects when necessary
- **Safe Navigation**: Uses `replace: true` to avoid history buildup

**Loop Prevention Logic:**
```typescript
const go = (targetPath: string) => {
  if (targetPath === pathname) {
    return; // Prevent redirect to same path
  }
  navigate(targetPath, { replace: true });
};
```

## 🧪 Testing Infrastructure

### 1. API Loop Testing Script (`apps/api/scripts/loop-test.sh`)

**Tests:**
- Health endpoint accessibility (should never redirect)
- Page redirect chains (max 5 redirects allowed)
- Authentication flow redirects
- API protection without redirects

**Usage:**
```bash
# Test local environment
cd adminer/apps/api
./scripts/loop-test.sh local

# Test production environment
./scripts/loop-test.sh prod

# Test both environments
./scripts/loop-test.sh all

# Get help
./scripts/loop-test.sh --help
```

### 2. Web App Loop Testing Script (`apps/web/scripts/web-loop-test.sh`)

**Tests:**
- React app loading without infinite redirects
- Client-side navigation behavior
- Static asset accessibility
- Page load completion

**Usage:**
```bash
# Test local environment
cd adminer/apps/web
./scripts/web-loop-test.sh local

# Test production environment
./scripts/web-loop-test.sh prod

# Test both environments
./scripts/web-loop-test.sh all

# Get help
./scripts/web-loop-test.sh --help
```

## 🔧 Environment Configuration

### Local Development (`apps/api/.env.local`)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Dodo
DODO_MODE=test
DODO_WEBHOOK_SECRET=whsec_test_123
```

### Local Web App (`apps/web/.env`)

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# App
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
```

### Production (Vercel Environment Variables)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# App
NEXT_PUBLIC_APP_URL=https://www.adminer.online
NODE_ENV=production

# Dodo
DODO_MODE=live
DODO_WEBHOOK_SECRET=whsec_live_xxx
```

## 🚀 Quick Loop Detection Commands

### Manual Testing (Local)

```bash
# Start API server
cd adminer/apps/api && npm run dev

# Start Web server (in another terminal)
cd adminer/apps/web && npm run dev

# Test API for loops
curl -sI -L --max-redirs 5 http://localhost:3000/ | grep -niE 'HTTP/|location'

# Test Web app for loops
curl -sI -L --max-redirs 5 http://localhost:5173/ | grep -niE 'HTTP/|location'
```

### Manual Testing (Production)

```bash
# Test production API
curl -sI -L --max-redirs 5 https://www.adminer.online/api/consolidated?action=health

# Test production web app
curl -sI -L --max-redirs 5 https://www.adminer.online/ | grep -niE 'HTTP/|location'
```

## 📊 What "Good" Looks Like

### ✅ Healthy Response Patterns

1. **Health Endpoint**: Always returns 200, never redirects
2. **Public Pages**: Load directly or redirect once (if already authenticated)
3. **Protected Pages**: Redirect once to signin (if not authenticated)
4. **API Routes**: Return 401/403 for unauthenticated requests (no redirects)

### ❌ Problematic Patterns

1. **Infinite Redirects**: More than 5 redirects in a chain
2. **API Redirects**: API routes that redirect instead of returning JSON errors
3. **Missing Keys**: Clerk publishable keys that cause auth failures
4. **Environment Mismatches**: URLs that don't match the actual host

## 🔍 Troubleshooting Common Issues

### Issue: "Too many redirects" Error

**Possible Causes:**
- Middleware redirecting to same path
- Client and server auth guards conflicting
- Environment variables missing

**Solutions:**
1. Check middleware loop guards
2. Verify environment variables
3. Test with loop detection scripts
4. Check Clerk configuration

### Issue: API Routes Redirecting

**Possible Causes:**
- Middleware not properly handling API routes
- Incorrect matcher configuration

**Solutions:**
1. Ensure API routes are excluded from page redirects
2. Verify middleware matcher configuration
3. Test health endpoint accessibility

### Issue: Client-Side Infinite Loops

**Possible Causes:**
- AuthRedirector not checking current path
- Clerk authentication state issues
- React Router navigation conflicts

**Solutions:**
1. Verify AuthRedirector loop prevention logic
2. Check Clerk authentication state
3. Test with web loop testing script

## 🎯 Best Practices

### 1. Always Test Before Deployment

```bash
# Run comprehensive tests
cd adminer/apps/api && ./scripts/loop-test.sh local
cd adminer/apps/web && ./scripts/web-loop-test.sh local

# Build and test
npm run build
npm run start  # Test production build locally
```

### 2. Monitor Production Logs

- Check Vercel function logs for redirect patterns
- Monitor browser console for client-side redirect loops
- Use loop testing scripts against production URLs

### 3. Environment Variable Management

- Never commit real keys to version control
- Use `.env.local` for local development
- Set production keys in Vercel dashboard
- Verify key validity before deployment

### 4. Gradual Rollout

- Test changes locally first
- Deploy to preview environments
- Monitor for redirect issues
- Roll back immediately if loops detected

## 📝 Maintenance

### Regular Testing Schedule

- **Daily**: Run local tests during development
- **Before Deploy**: Test both local and production builds
- **After Deploy**: Verify production functionality
- **Weekly**: Run comprehensive loop detection against production

### Script Updates

- Keep testing scripts updated with new routes
- Add new test cases for new authentication flows
- Update environment variable examples
- Document new loop prevention measures

---

**Remember**: Infinite redirect loops can break your entire application. Always test thoroughly and monitor production closely! 🚨 