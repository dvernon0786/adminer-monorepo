#!/usr/bin/env node

/**
 * Setup Husky for local development
 * Run this script manually after cloning the repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Husky for local development...');

try {
  // Check if we're in a git repository
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  
  // Install Husky
  console.log('📦 Installing Husky...');
  execSync('npx husky install', { stdio: 'inherit' });
  
  // Check if pre-commit hook exists
  const preCommitPath = path.join(__dirname, '..', '.husky', 'pre-commit');
  if (fs.existsSync(preCommitPath)) {
    console.log('✅ Pre-commit hook already exists');
  } else {
    console.log('⚠️  Pre-commit hook not found. Please ensure .husky/pre-commit exists');
  }
  
  console.log('🎉 Husky setup complete!');
  console.log('💡 Pre-commit hooks will now run automatically on commits');
  
} catch (error) {
  if (error.message.includes('not a git repository')) {
    console.log('⚠️  Not in a git repository. Skipping Husky setup.');
  } else {
    console.error('❌ Error setting up Husky:', error.message);
    process.exit(1);
  }
} 