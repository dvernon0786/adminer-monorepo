# 🔧 Adminer Inngest Billing System - Troubleshooting Guide

## 🚨 Common Failures & Fast Fixes

### 1. Database Connection Issues

#### "no pg_hba.conf entry" / SSL errors
- **Cause**: Neon requires SSL connections
- **Fix**: Ensure `DATABASE_URL` includes `?sslmode=require`
- **Example**: `postgres://user:pass@host:port/db?sslmode=require`

#### Self-signed certificate errors
- **Cause**: SSL verification issues
- **Fix**: Use `sslmode=require` (avoid `verify-full` in dev)
- **Alternative**: `sslmode=prefer` for development

#### "could not translate host name"
- **Cause**: Malformed DATABASE_URL or shell expansion issues
- **Fix**: Ensure URL is properly quoted and exported
- **Check**: Run `echo "$DATABASE_URL"` to verify format

### 2. Inngest Connection Issues

#### ECONNREFUSED to Inngest
- **Cause**: Inngest dev server not running
- **Fix**: Start with `npx inngest-cli@latest dev`
- **Verify**: Check if bound to `http://localhost:8288`

#### Framework route not reachable
- **Cause**: API server not running or misconfigured
- **Fix**: Start API with `npm run dev`
- **Check**: `curl http://localhost:3000/api/inngest` should return 200

#### Corporate VPN/proxy issues
- **Cause**: Network restrictions
- **Fix**: Test with VPN disabled
- **Alternative**: Use local development mode

### 3. Authentication Issues

#### 401/403 from admin endpoint
- **Cause**: Authentication bypass not working
- **Check**: Ensure `ALLOW_UNAUTH_DEV=true` in `.env.local`
- **Verify**: Code path reads the env var correctly
- **Note**: Only works for POST requests

#### Clerk JWT issues
- **Cause**: Invalid or expired tokens
- **Fix**: Use dev bypass or valid Clerk credentials
- **Check**: Verify Clerk keys in `.env.local`

### 4. Method Not Allowed (405)

#### GET vs POST confusion
- **Cause**: Endpoint only accepts POST
- **Fix**: Use POST for all requests (including dry runs)
- **Example**: `curl -X POST "?dryRun=1"`

#### CSRF protection
- **Cause**: Next.js CSRF middleware
- **Fix**: Ensure proper Content-Type headers
- **Check**: Handler returns clear error messages

### 5. TypeScript Compilation Issues

#### Node types missing
- **Cause**: `@types/node` not installed
- **Fix**: `npm install --save-dev @types/node`
- **Verify**: `tsconfig.json` has `"types": ["node"]`

#### Import path errors
- **Cause**: Path alias resolution issues
- **Fix**: Use relative paths in `apps/api`
- **Check**: All imports use `../` or `./` format

#### Crypto module errors
- **Cause**: Node.js vs browser crypto
- **Fix**: Use `import * as crypto from "crypto"`
- **Verify**: No `runtime = 'edge'` on crypto routes

## 🧪 Testing Troubleshooting

### Smoke Test Failures

#### Database migration fails
- **Check**: Database permissions and connection
- **Verify**: Migration script syntax
- **Fix**: Run manually with `psql "$DATABASE_URL" -f script.sql`

#### Test data seeding fails
- **Check**: Table schema matches expectations
- **Verify**: No conflicting data
- **Fix**: Clear existing test data first

#### API endpoints not responding
- **Check**: Server logs for errors
- **Verify**: Port 3000 is available
- **Fix**: Restart API server

### Verification Script Issues

#### SQL syntax errors
- **Cause**: PostgreSQL version compatibility
- **Fix**: Use standard SQL syntax
- **Check**: Test queries manually

#### Expected results mismatch
- **Cause**: Data state changed during test
- **Fix**: Re-run from clean state
- **Verify**: Check database state manually

## 🔍 Debugging Techniques

### 1. Enable Verbose Logging
```bash
# Set in .env.local
LOG_LEVEL=debug
NEXT_RUNTIME_LOG=info
```

### 2. Check Server Logs
```bash
# API server logs
cd adminer/apps/api && npm run dev

# Inngest dev logs
npx inngest-cli@latest dev
```

### 3. Database Debugging
```bash
# Connect and inspect
psql "$DATABASE_URL"

# Check table structure
\d+ orgs
\d+ webhook_events
\d+ jobs

# Verify data
SELECT * FROM orgs WHERE id LIKE 'test_smoke_%';
```

### 4. Network Debugging
```bash
# Test endpoints
curl -v http://localhost:3000/api/inngest
curl -v -X POST "http://localhost:3000/api/admin/downgrade-canceled?dryRun=1"

# Check ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :8288
```

## 🚀 Recovery Procedures

### 1. Clean Slate Reset
```bash
# Clear test data
psql "$DATABASE_URL" -c "DELETE FROM orgs WHERE id LIKE 'test_smoke_%';"

# Restart servers
pkill -f "npm run dev"
pkill -f "inngest-cli"
```

### 2. Database Recovery
```bash
# Check migration status
psql "$DATABASE_URL" -c "\dt+"

# Re-run migrations if needed
psql "$DATABASE_URL" -f scripts/2025-08-22_add_current_period_end.sql
```

### 3. Environment Reset
```bash
# Reload environment
source adminer/apps/api/.env.local

# Verify variables
echo "DATABASE_URL: $DATABASE_URL"
echo "ALLOW_UNAUTH_DEV: $ALLOW_UNAUTH_DEV"
```

## 📞 Getting Help

### 1. Check Logs First
- API server console output
- Inngest dev server logs
- Database error messages

### 2. Common Patterns
- **Connection issues**: Check network and credentials
- **Auth issues**: Verify environment variables
- **Compilation errors**: Check TypeScript config and dependencies
- **Runtime errors**: Check server logs and database state

### 3. Escalation
- Document exact error messages
- Note environment and configuration
- Include relevant log snippets
- Test with minimal configuration

## 🎯 Success Indicators

### ✅ System Ready
- Preflight check passes with no failures
- TypeScript compiles without errors
- Database connects and schema is correct
- API server starts without errors
- Inngest dev server connects successfully

### ✅ Test Success
- Smoke test completes all steps
- Database state changes as expected
- API endpoints respond correctly
- Logs show successful operations
- Verification scripts pass all checks

### ✅ Production Ready
- All tests pass consistently
- Error handling works as expected
- Logging provides adequate visibility
- Configuration is secure and documented
- Monitoring and alerting configured 