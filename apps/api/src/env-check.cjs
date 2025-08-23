const fs = require('fs');
const path = require('path');

// Load .env.local file if it exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📁 Loading environment variables from .env.local...');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  // Parse .env.local file and set process.env
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded .env.local file');
}

// Check for Clerk environment variables with flexible naming
const clerkPublishableKeys = [
  "CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", 
  "VITE_CLERK_PUBLISHABLE_KEY"
];

const hasAnyPublishableKey = clerkPublishableKeys.some(key => !!process.env[key]);

// Single-source approach: only publishable keys
if (!hasAnyPublishableKey) {
  console.error("❌ No Clerk publishable key found (need at least one of):");
  clerkPublishableKeys.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ Missing Clerk server key: CLERK_SECRET_KEY");
  process.exit(1);
}

console.log("✅ Env check passed.");
console.log(`✅ Clerk publishable key found: ${clerkPublishableKeys.find(key => !!process.env[key])}`);
console.log("✅ Clerk secret key found: CLERK_SECRET_KEY"); 