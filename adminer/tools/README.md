# 🔍 Hardcoded Value Scanner

## Overview

The Hardcoded Value Scanner is a security tool that automatically detects potential security risks, placeholders, and hardcoded values across your codebase. It's designed to prevent accidental commits of sensitive information and ensure proper configuration management.

## 🚀 Quick Start

### Run the Scanner

```bash
# From the adminer directory
npm run scan:hardcoded
```

### Setup Husky (Local Development Only)

**Important**: Husky is only set up for local development to avoid build issues in production.

```bash
# Set up Husky for local development (run once after cloning)
npm run setup:husky

# This will install pre-commit hooks that run the scanner automatically
```

### Pre-commit Hook

After running `npm run setup:husky`, the scanner automatically runs before each commit via Husky. If any issues are found, the commit will be blocked until resolved.

### CI/CD Integration

The scanner runs automatically on every push and pull request via GitHub Actions.

## 🔧 Configuration

### Scanner Configuration (`hardcoded-scan.config.json`)

The scanner uses a JSON configuration file with three main sections:

#### 1. File Patterns

```json
{
  "include": [
    "**/*.{ts,tsx,js,jsx,json,yaml,yml,env,sh,md,html,css,scss}",
    "apps/**/*.{ts,tsx,js,jsx,json,yaml,yml,env,sh,md,html,css,scss}"
  ],
  "exclude": [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/apps/api/public/assets/**"
  ]
}
```

#### 2. Whitelist

Strings that should NOT trigger alerts:

```json
{
  "whitelist": [
    "localhost:3000",
    "127.0.0.1",
    "example.com",
    "https://api.dodopayments.com",
    "YOUR_TEST_KEY_HERE"
  ]
}
```

#### 3. Detection Patterns

Regex patterns for different types of issues:

```json
{
  "patterns": [
    {
      "id": "PLACEHOLDER_GENERIC",
      "regex": "(YOUR_|REPLACE_ME|<TO_BE_FILLED>|TBD|CHANGEME)"
    },
    {
      "id": "CLERK_KEYS",
      "regex": "\\b(pk|sk)_[A-Za-z0-9]{10,}\\b"
    }
  ]
}
```

## 🎯 What Gets Detected

### Security Risks
- **API Keys**: `sk_...`, `pk_...`, `ghp_...`
- **Database URLs**: `postgres://...`, `mongodb+srv://...`
- **Private Keys**: `-----BEGIN RSA PRIVATE KEY-----`
- **JWT Tokens**: `Bearer <token>`
- **AWS Keys**: `AKIA...`

### Placeholders
- **Generic**: `YOUR_...`, `REPLACE_ME`, `<TO_BE_FILLED>`
- **TODOs**: `TODO`, `FIXME`, `HACK`, `XXX`
- **Hardcoded Fallbacks**: `process.env.X || "hardcoded-value"`

### Other Issues
- **Local Paths**: `/Users/...`, `C:\Users\...`
- **Magic Numbers**: Numbers with 6+ digits
- **Hardcoded URLs**: Any `http(s)://` URLs not in whitelist

## 🛠️ Customization

### Adding New Patterns

1. Edit `tools/hardcoded-scan.config.json`
2. Add a new pattern to the `patterns` array:

```json
{
  "id": "CUSTOM_PATTERN",
  "regex": "your_regex_here",
  "description": "What this pattern detects"
}
```

### Whitelisting Legitimate Strings

1. Add the string to the `whitelist` array
2. Use exact matches or regex patterns
3. Test with `npm run scan:hardcoded`

### Excluding Files/Directories

1. Add patterns to the `exclude` array
2. Use glob patterns (e.g., `**/build/**`, `**/*.min.js`)

## 📊 Understanding Scan Results

### Sample Output

```
🔍 Scanning for hardcoded values, placeholders, and security risks...
📁 Root directory: /path/to/repo
⚙️  Config file: /path/to/repo/tools/hardcoded-scan.config.json

📋 Found 73 files to scan
🔍 Using 18 detection patterns

📊 Scan complete!
   Files scanned: 73
   Files with issues: 0
   Total findings: 0

✅ No hardcoded values/placeholders detected.
🎉 Your repository is clean!
```

### Interpreting Results

- **File Counts**: Total files scanned vs. files with issues
- **Finding Groups**: Grouped by issue type for easier review
- **Context**: Shows surrounding code for each finding
- **Line Numbers**: Exact location of each issue

## 🔒 Security Best Practices

### 1. Environment Variables

✅ **Good**:
```typescript
const apiKey = process.env.API_KEY
```

❌ **Bad**:
```typescript
const apiKey = "sk_live_1234567890abcdef"
```

### 2. Configuration Files

✅ **Good**:
```typescript
const config = {
  apiUrl: process.env.API_URL || 'https://api.example.com'
}
```

❌ **Bad**:
```typescript
const config = {
  apiUrl: 'https://api.example.com'
}
```

### 3. Documentation

✅ **Good**:
```bash
# Set your API key
API_KEY=your_actual_key_here
```

❌ **Bad**:
```bash
# Set your API key
API_KEY=sk_live_1234567890abcdef
```

## 🚨 Common Issues & Solutions

### False Positives

**Issue**: Legitimate URLs triggering `HARDCODED_URL` alerts

**Solution**: Add to whitelist:
```json
{
  "whitelist": [
    "https://api.example.com",
    "https://docs.example.com"
  ]
}
```

### Pattern Conflicts

**Issue**: Regex pattern too broad, catching legitimate strings

**Solution**: Make pattern more specific:
```json
{
  "regex": "\\bBearer\\s+[A-Za-z0-9\\-_.]{20,}\\b"
}
```

### Whitelist Overuse

**Issue**: Too many strings in whitelist, reducing scanner effectiveness

**Solution**: Only whitelist truly legitimate strings, fix actual issues

## 🔄 Integration

### Pre-commit Hook (Local Development)

**Setup**:
```bash
npm run setup:husky
```

**Usage**: Automatically runs on every commit:
```bash
git commit -m "your message"
# Scanner runs automatically, blocks commit if issues found
```

### CI/CD Pipeline

Runs on every push/PR:

```yaml
# .github/workflows/hardcoded-scan.yml
- name: Run hardcoded value scan
  run: npm run scan:hardcoded
```

### IDE Integration

Add to your editor's linting pipeline:

```json
// package.json
{
  "scripts": {
    "lint": "eslint . && npm run scan:hardcoded"
  }
}
```

## 📈 Performance

### Scan Speed

- **Small repos** (<100 files): ~1-2 seconds
- **Medium repos** (100-1000 files): ~5-10 seconds
- **Large repos** (>1000 files): ~15-30 seconds

### Optimization Tips

1. **Exclude build artifacts**: `**/dist/**`, `**/build/**`
2. **Exclude dependencies**: `**/node_modules/**`
3. **Exclude generated files**: `**/*.min.js`, `**/*.map`

## 🆘 Troubleshooting

### Common Errors

#### "Config file not found"
```bash
❌ Config file not found: /path/to/tools/hardcoded-scan.config.json
```

**Solution**: Ensure you're running from the correct directory

#### "Invalid regular expression"
```bash
SyntaxError: Invalid regular expression
```

**Solution**: Check regex patterns in config file for syntax errors

#### "Module not found"
```bash
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'fast-glob'
```

**Solution**: Run `npm install` to install dependencies

### Debug Mode

For detailed debugging, you can modify the scanner to add more logging:

```typescript
// In hardcoded-scan.ts
console.log('Processing file:', file);
console.log('Pattern match:', matched);
```

## 🤝 Contributing

### Adding New Patterns

1. Identify a new security risk pattern
2. Add to `hardcoded-scan.config.json`
3. Test with `npm run scan:hardcoded`
4. Update documentation

### Improving Whitelist

1. Review false positives
2. Add legitimate strings to whitelist
3. Ensure whitelist doesn't hide real issues

### Performance Improvements

1. Optimize regex patterns
2. Improve file filtering
3. Add parallel processing for large repos

## 📚 Resources

- [Regex101](https://regex101.com/) - Test regex patterns
- [Glob Patterns](https://github.com/micromatch/micromatch) - File matching patterns
- [Security Best Practices](https://owasp.org/www-project-top-ten/) - OWASP guidelines

---

**Status**: 🎯 **Production Ready**

The scanner is actively protecting your repository from security risks and configuration issues!

**Note**: Husky setup is manual to avoid production build issues. Run `npm run setup:husky` after cloning for local development. 