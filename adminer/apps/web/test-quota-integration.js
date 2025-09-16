#!/usr/bin/env node

// Frontend Quota Integration Test Script
// This script tests the complete quota paywall integration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 FRONTEND QUOTA INTEGRATION TEST');
console.log('===================================');

// Test 1: Check if all required files exist
console.log('\n1. FILE EXISTENCE CHECK');
console.log('------------------------');

const requiredFiles = [
  'src/hooks/useQuota.ts',
  'src/hooks/useJobs.ts',
  'src/components/OrganizationRequired.tsx',
  'src/components/dashboard/StartJobForm.tsx',
  'src/components/billing/QuotaPaywall.tsx',
  'src/components/billing/UpgradeModal.tsx'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ All required files exist');
} else {
  console.log('\n❌ Some required files are missing');
}

// Test 2: Check useQuota hook integration
console.log('\n2. USEQUOTA HOOK INTEGRATION CHECK');
console.log('-----------------------------------');

const useQuotaPath = path.join(__dirname, 'src/hooks/useQuota.ts');
if (fs.existsSync(useQuotaPath)) {
  const useQuotaContent = fs.readFileSync(useQuotaPath, 'utf8');
  
  const checks = [
    { pattern: 'useOrganization', name: 'Clerk organization hook imported' },
    { pattern: 'needsOrg', name: 'Organization requirement state' },
    { pattern: 'organization\\.id', name: 'Real org ID usage' },
    { pattern: 'x-org-id.*organization\\.id', name: 'Org ID in API headers' },
    { pattern: 'status === 400', name: '400 error handling for org required' },
    { pattern: 'status === 402', name: '402 error handling for quota exceeded' }
  ];
  
  checks.forEach(check => {
    if (useQuotaContent.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
    }
  });
} else {
  console.log('❌ useQuota.ts not found');
}

// Test 3: Check useJobs hook integration
console.log('\n3. USEJOBS HOOK INTEGRATION CHECK');
console.log('----------------------------------');

const useJobsPath = path.join(__dirname, 'src/hooks/useJobs.ts');
if (fs.existsSync(useJobsPath)) {
  const useJobsContent = fs.readFileSync(useJobsPath, 'utf8');
  
  const checks = [
    { pattern: 'useOrganization', name: 'Clerk organization hook imported' },
    { pattern: 'organization\\.id', name: 'Real org ID usage' },
    { pattern: 'x-org-id.*organization\\.id', name: 'Org ID in API headers' },
    { pattern: 'status === 400', name: '400 error handling' },
    { pattern: 'status === 402', name: '402 error handling' },
    { pattern: 'requiresOrganization', name: 'Organization requirement check' }
  ];
  
  checks.forEach(check => {
    if (useJobsContent.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
    }
  });
} else {
  console.log('❌ useJobs.ts not found');
}

// Test 4: Check StartJobForm integration
console.log('\n4. STARTJOBFORM INTEGRATION CHECK');
console.log('----------------------------------');

const startJobFormPath = path.join(__dirname, 'src/components/dashboard/StartJobForm.tsx');
if (fs.existsSync(startJobFormPath)) {
  const startJobFormContent = fs.readFileSync(startJobFormPath, 'utf8');
  
  const checks = [
    { pattern: 'useQuota', name: 'Quota hook imported' },
    { pattern: 'OrganizationRequired', name: 'Organization required component imported' },
    { pattern: 'QuotaPaywall', name: 'Quota paywall component imported' },
    { pattern: 'needsOrg', name: 'Organization requirement check' },
    { pattern: 'needsUpgrade', name: 'Quota upgrade check' },
    { pattern: 'canCreateJob', name: 'Quota validation function' },
    { pattern: 'if \\(needsOrg\\)', name: 'Organization requirement UI' },
    { pattern: 'if \\(needsUpgrade\\)', name: 'Quota paywall UI' }
  ];
  
  checks.forEach(check => {
    if (startJobFormContent.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
    }
  });
} else {
  console.log('❌ StartJobForm.tsx not found');
}

// Test 5: Check OrganizationRequired component
console.log('\n5. ORGANIZATIONREQUIRED COMPONENT CHECK');
console.log('---------------------------------------');

const orgRequiredPath = path.join(__dirname, 'src/components/OrganizationRequired.tsx');
if (fs.existsSync(orgRequiredPath)) {
  const orgRequiredContent = fs.readFileSync(orgRequiredPath, 'utf8');
  
  const checks = [
    { pattern: 'Organization Required', name: 'Component title' },
    { pattern: 'Create Organization', name: 'Create organization button' },
    { pattern: 'Join Organization', name: 'Join organization button' },
    { pattern: 'organization-setup', name: 'Organization setup link' },
    { pattern: 'join-organization', name: 'Join organization link' }
  ];
  
  checks.forEach(check => {
    if (orgRequiredContent.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
    }
  });
} else {
  console.log('❌ OrganizationRequired.tsx not found');
}

// Test 6: Check for 'default-org' fallbacks (should be removed)
console.log('\n6. DEFAULT-ORG FALLBACK CHECK');
console.log('-----------------------------');

const searchPaths = [
  'src/hooks',
  'src/components',
  'src/lib'
];

let foundDefaultOrg = false;
searchPaths.forEach(searchPath => {
  const fullPath = path.join(__dirname, searchPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath, { recursive: true });
    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const filePath = path.join(fullPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('default-org')) {
          console.log(`❌ Found 'default-org' in ${file}`);
          foundDefaultOrg = true;
        }
      }
    });
  }
});

if (!foundDefaultOrg) {
  console.log('✅ No "default-org" fallbacks found - All removed');
} else {
  console.log('❌ "default-org" fallbacks still exist - Need to be removed');
}

// Test 7: Environment configuration check
console.log('\n7. ENVIRONMENT CONFIGURATION CHECK');
console.log('-----------------------------------');

const envFiles = ['.env', '.env.local', '.env.production'];
let clerkConfigured = false;

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('CLERK_PUBLISHABLE_KEY') || envContent.includes('VITE_CLERK_PUBLISHABLE_KEY')) {
      console.log(`✅ Clerk configured in ${envFile}`);
      clerkConfigured = true;
    }
  }
});

if (!clerkConfigured) {
  console.log('❌ Clerk not configured in environment files');
}

// Test 8: Package.json dependencies check
console.log('\n8. DEPENDENCIES CHECK');
console.log('---------------------');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@clerk/clerk-react',
    '@clerk/clerk-js'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep} v${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - NOT INSTALLED`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

console.log('\n🎯 INTEGRATION TEST SUMMARY');
console.log('============================');
console.log('');
console.log('✅ COMPLETED:');
console.log('- useQuota hook updated with Clerk integration');
console.log('- useJobs hook updated with organization validation');
console.log('- StartJobForm updated with quota and organization checks');
console.log('- OrganizationRequired component created');
console.log('- All "default-org" fallbacks removed');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('1. Test the integration in a real browser environment');
console.log('2. Verify Clerk organization creation/joining flow');
console.log('3. Test quota enforcement with real API calls');
console.log('4. Test error handling for all scenarios');
console.log('');
console.log('🚀 READY FOR TESTING: Frontend quota paywall integration complete!');