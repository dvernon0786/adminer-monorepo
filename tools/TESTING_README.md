# Hardcoded Scanner Testing Guide

## Overview

This document describes the testing setup for the hardcoded value scanner, which helps identify potential security vulnerabilities in the codebase.

## Test Setup

### Dependencies
The testing framework uses Jest with TypeScript support:

```bash
npm install --save-dev jest ts-jest @types/jest
```

### Configuration
Jest is configured in `jest.config.js` with:
- TypeScript preset (`ts-jest`)
- Node.js test environment
- Test matching pattern: `**/tools/**/*.spec.ts`

## Test Files

### `hardcoded-scan.spec.ts`
Tests the core functionality of the hardcoded scanner:

#### Test Suites

1. **hardcoded-scan shared helper**
   - ✅ **detects documentation files**: Verifies that `isDocsFile()` correctly identifies documentation, examples, and configuration files
   - ✅ **does not flag real code files**: Ensures that actual source code files are not treated as documentation

2. **CLERK_KEYS regex pattern**
   - ✅ **matches real Clerk-style keys**: Tests that the regex correctly identifies valid Clerk API keys (both hyphen and underscore formats)
   - ✅ **does not match noise or short tokens**: Verifies that the pattern rejects invalid or too-short tokens
   - ✅ **catches real Clerk keys even in documentation**: Ensures that real API keys are detected even when embedded in documentation (security feature)

## Running Tests

### Single Run
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Specific Test File
```bash
npx jest tools/hardcoded-scan.spec.ts
```

## Test Coverage

The test suite covers:

### Documentation Detection
- Markdown files (`.md`, `.mdx`)
- Text files (`.txt`, `.adoc`, `.rst`)
- Documentation directories (`/docs/`, `/doc/`)
- Example directories (`/examples/`, `/samples/`)
- Configuration files (`.env.example`)
- Scanner's own files (to prevent self-noise)

### Security Pattern Detection
- **Clerk API Keys**: `pk_live_*`, `sk_live_*`, `pk-live-*`, `sk-live-*`
- **Pattern Validation**: Ensures keys are at least 12 characters long
- **Boundary Checking**: Uses lookarounds to avoid false positives

### Security Behavior
- **Documentation Scanning**: Real API keys are detected even in documentation files
- **False Positive Prevention**: Short or invalid tokens are not flagged
- **Pattern Accuracy**: Both hyphen and underscore formats are supported

## Test Results

### Expected Output
```
 PASS  tools/hardcoded-scan.spec.ts

  hardcoded-scan shared helper
    ✓ detects documentation files
    ✓ does not flag real code files

  CLERK_KEYS regex pattern
    ✓ matches real Clerk-style keys
    ✓ does not match noise or short tokens
    ✓ catches real Clerk keys even in documentation

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

### Test Cases

#### Documentation Files (Should be detected)
- `README.md` ✅
- `docs/guide.txt` ✅
- `examples/demo.js` ✅
- `tools/hardcoded-scan.config.json` ✅
- `tools/hardcoded-scan.ts` ✅

#### Code Files (Should NOT be detected)
- `src/index.ts` ❌
- `apps/api/server.ts` ❌

#### Valid Clerk Keys (Should match)
- `sk_live_ABCDEFGHIJKLMNOP` ✅
- `pk_live_1234567890abcdef` ✅
- `sk-live-EXAMPLE_EXAMPLE_EXAMPLE` ✅
- `pk-live-0987654321ZYXWVU` ✅

#### Invalid Tokens (Should NOT match)
- `sk_fake_key` ❌
- `not_a_key` ❌
- `random text pk_123` ❌ (too short)

#### Security Cases (Should match - even in docs)
- `docs/sk_live_SAMPLEONLY` ✅ (contains real key)
- `README with pk_live_1234567890abcdef` ✅ (contains real key)

## Security Implications

### Why Documentation Scanning is Important
The scanner intentionally detects real API keys even in documentation files because:

1. **Accidental Exposure**: Real keys might be accidentally committed to documentation
2. **Security Review**: Documentation should not contain real credentials
3. **Best Practice**: All real keys should be detected regardless of location
4. **False Negative Prevention**: Missing a real key in docs is worse than a false positive

### Pattern Design
The `CLERK_KEYS` regex pattern:
- Uses lookarounds `(?<![A-Za-z0-9])` and `(?![A-Za-z0-9_-])` for precise boundaries
- Supports both hyphen (`-`) and underscore (`_`) separators
- Requires minimum length of 12 characters
- Catches both `pk_` and `sk_` prefixes

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `esModuleInterop: true` in TypeScript config
2. **Pattern Mismatches**: Verify regex patterns in `hardcoded-scan.config.json`
3. **Test Failures**: Check that test expectations match actual security requirements

### Debugging Tests
Add console.log statements to see which specific strings are failing:

```typescript
it("does not match noise or short tokens", () => {
  for (const str of shouldNotMatch) {
    const result = clerkPattern.test(str);
    if (result) {
      console.log(`Pattern unexpectedly matched: "${str}"`);
    }
    expect(result).toBe(false);
  }
});
```

## Integration with CI/CD

### Pre-commit Hooks
The scanner is integrated with Husky for pre-commit validation:

```bash
npm run scan:hardcoded
```

### CI Pipeline
Include scanner checks in your CI pipeline:

```yaml
- name: Run Security Scanner
  run: npm run scan:hardcoded
```

## Best Practices

1. **Run Tests Before Commits**: Use `npm test` to verify scanner behavior
2. **Update Patterns**: Keep security patterns current with new API formats
3. **Document Changes**: Update tests when modifying scanner behavior
4. **Security First**: Prefer false positives over false negatives in security scanning

---

## Summary

The hardcoded scanner testing suite provides comprehensive validation of:
- ✅ **Documentation Detection**: Accurate identification of docs vs. code
- ✅ **Security Pattern Matching**: Precise detection of API keys and secrets
- ✅ **Security Behavior**: Real keys detected even in documentation
- ✅ **False Positive Prevention**: Invalid tokens properly rejected

**All tests pass, confirming the scanner is working correctly and securely.** 🎯✅ 