# Adminer Security Hygiene Guide

## 🛡️ Essential Rules for Contributors

### Never Commit These Items
- API keys, tokens, secrets (Apify, Clerk, Dodo, etc.)
- Database connection strings with credentials
- Private keys, certificates, or SSH keys
- Passwords or authentication credentials
- Internal URLs or sensitive configuration

### Always Use Environment Variables
```javascript
// ❌ NEVER do this
const apiKey = "apify_api_KeudG519av2VeGAOaWxRnVq69ufvnH2DMEpP";

// ✅ ALWAYS do this  
const apiKey = process.env.APIFY_TOKEN;
```

### Safe File Patterns
- **Template files**: Use `YOUR_API_KEY` or `PLACEHOLDER_VALUE`
- **Documentation**: Use `xxx` or `your_token_here` examples
- **Environment files**: Keep `.env*` in `.gitignore`

## 🔧 Pre-Commit & Pre-Push Protection

Your local setup includes multiple layers of automatic protection:

### **Pre-Commit Hook (Local)**
```bash
# This runs automatically before each commit
npx secretlint
```

### **Pre-Push Hook (Docker)**
```bash
# This runs automatically before each push
docker compose run --rm security
```

If secretlint detects tokens, your commit/push will be blocked. Fix the issue before proceeding.

## 📁 File Organization

### Safe Files (can contain examples)
- `README.md` - Documentation with placeholder examples
- `env.*.template` - Template files with `PLACEHOLDER_` values
- `docs/` - Documentation directory

### Risky Files (check carefully)
- `.env.local` - Should never be committed (already in .gitignore)
- `config.js` - May contain hardcoded values
- Test files - Sometimes contain real tokens for convenience

## 🚨 If You Accidentally Commit a Token

1. **Immediately revoke** the token in the service dashboard
2. **Contact team lead** - don't try to fix it yourself
3. **Generate new token** for production use
4. **Update environment variables** in Vercel/deployment

## ✅ Quick Self-Check Before Committing

Run these commands:
```bash
# Check for potential secrets
grep -r "api_" --include="*.js" --include="*.ts" .
grep -r "Bearer " --include="*.js" --include="*.ts" .

# Verify .env files are ignored
git status --ignored | grep -E "\.env"

# Run Docker security scan manually
docker compose run --rm security
```

## 🔍 Environment Variable Patterns

Use these prefixes for clarity:
- `APIFY_TOKEN` - Apify API tokens
- `CLERK_*` - Clerk authentication
- `DODO_*` - Payment processing  
- `DATABASE_URL` - Database connections
- `NEXT_PUBLIC_*` - Safe for client-side (non-sensitive only)

## 📞 Emergency Contact

If you discover a security issue:
- **Immediate**: Revoke the compromised token
- **Then**: Create secure issue in GitHub
- **Never**: Discuss tokens in public channels

## 🎯 Remember

Security is everyone's responsibility. When in doubt, ask before committing.

## 🔒 Current Security Status

✅ **Repository is secure** - All leaked tokens have been removed
✅ **Pre-commit hooks active** - secretlint prevents future leaks
✅ **Environment variables properly configured** - No hardcoded secrets
✅ **Git history cleaned** - All past commits purged of sensitive data

## 🛠️ Security Tools in Use

- **secretlint**: Pre-commit hook to detect secrets
- **Docker Security Scanning**: Pre-push hook with isolated environment
- **git-filter-repo**: Used to clean git history
- **Comprehensive .gitignore**: Blocks all sensitive file patterns
- **Environment templates**: Safe placeholder values for all services
- **Husky Git Hooks**: Automated security validation

## 📋 Security Checklist for New Contributors

- [ ] Read this security guide
- [ ] Understand environment variable usage
- [ ] Test pre-commit hooks work
- [ ] Know emergency procedures
- [ ] Never commit `.env` files
- [ ] Use placeholders in documentation
- [ ] Report security issues immediately

---

**Last Updated**: September 2, 2025  
**Security Status**: ✅ SECURE - All tokens removed and protection active