# GitHub Actions CI/CD System

## Overview

This repository uses a unified CI/CD system built with GitHub Actions composite actions for efficient dependency caching and reliable builds across npm workspaces.

## Architecture

### Composite Actions

#### `setup-node-npm-workspaces`
- **Location**: `.github/actions/setup-node-npm-workspaces/action.yml`
- **Purpose**: Auto-discovers all `package-lock.json` files and sets up Node.js with proper caching
- **Benefits**: Eliminates cache warnings and improves build performance

### Workflows

#### `monorepo-ci.yml`
- **Purpose**: Unified CI pipeline for all jobs
- **Jobs**:
  1. **check-guards**: Fast static checks (runs on Node 18.x, 20.x, 22.x matrix)
  2. **health**: Waits for Vercel deployment, then tests health endpoint
  3. **smoke_prod**: End-to-end production testing

## Features

### 🚀 **Smart Caching**
- Auto-discovers all `package-lock.json` files
- Caches dependencies across all workspaces
- No more "Some specified paths were not resolved" warnings

### 🔄 **Concurrency Control**
- Prevents duplicate runs on same ref
- Cancels stale runs automatically

### 🌙 **Nightly Testing**
- Runs smoke tests every night at 18:00 UTC
- Ensures production stability

### 📊 **Vercel Integration**
- Waits for deployments to be READY before testing
- Falls back to URL ping if API credentials unavailable
- Configurable timeouts and polling intervals

### 🎯 **Flexible Script Detection**
- Auto-detects bash scripts or npm scripts
- Graceful fallbacks with clear error messages
- Uploads logs and artifacts on failures

## Required Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `PROD_URL` | ✅ | Production URL for health/smoke tests |
| `VERCEL_TOKEN` | ⚙️ | Vercel API token for deployment polling |
| `VERCEL_PROJECT_ID` | ⚙️ | Vercel project ID for deployment polling |
| `VERCEL_TEAM_ID` | ❌ | Vercel team ID (if project is under a team) |

## Usage

### Basic Setup
```yaml
- name: Setup Node (cached)
  uses: ./.github/actions/setup-node-npm-workspaces
  with:
    node-version: 20.x
    run-install: false
```

### With Installation
```yaml
- name: Setup Node (cached)
  uses: ./.github/actions/setup-node-npm-workspaces
  with:
    node-version: 20.x
    run-install: true
    working-directory: apps/api
```

### Custom Lockfile Patterns
```yaml
- name: Setup Node (cached)
  uses: ./.github/actions/setup-node-npm-workspaces
  with:
    lockfile_globs: |
      package-lock.json
      apps/*/package-lock.json
      packages/*/package-lock.json
```

## Benefits

1. **Performance**: Efficient dependency caching across all workspaces
2. **Reliability**: Smart deployment waiting and graceful fallbacks
3. **Maintainability**: DRY approach with reusable composite actions
4. **Monitoring**: Comprehensive logging and artifact uploads
5. **Flexibility**: Auto-detection of scripts and configurable behavior

## Troubleshooting

### Cache Warnings
If you see cache warnings, ensure your `package-lock.json` files are in the expected locations:
- Root: `package-lock.json`
- Apps: `apps/*/package-lock.json`

### Health Check Failures
1. Verify `PROD_URL` secret is set correctly
2. Check if the health endpoint is accessible
3. Review health check logs for detailed error information

### Vercel Deployment Issues
1. Ensure `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are set
2. Check Vercel API permissions
3. Verify project ID is correct 