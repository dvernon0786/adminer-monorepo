#!/usr/bin/env node

/**
 * Generate Clerk JWT tokens for smoke testing
 * 
 * Usage:
 * 1. Get your HS256 signing secret from Clerk Dashboard → JWT Templates
 * 2. Set it as environment variable: export CLERK_HS256_SECRET="your_secret_here"
 * 3. Run: node scripts/mint-clerk-test-jwts.mjs
 */

import { SignJWT } from 'jose';
import { webcrypto } from 'crypto';

// Polyfill crypto for Node.js 18
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const CLERK_HS256_SECRET = process.env.CLERK_HS256_SECRET;

if (!CLERK_HS256_SECRET) {
  console.error('❌ Error: CLERK_HS256_SECRET environment variable not set');
  console.log('\n📋 To get your secret:');
  console.log('1. Go to Clerk Dashboard → JWT Templates');
  console.log('2. Create a new HS256 template');
  console.log('3. Copy the "Signing Secret" value');
  console.log('4. Set: export CLERK_HS256_SECRET="your_secret_here"');
  process.exit(1);
}

async function generateToken(sub, orgExternalId, plan) {
  const secret = new TextEncoder().encode(CLERK_HS256_SECRET);
  
  const jwt = await new SignJWT({
    sub,
    org_external_id: orgExternalId,
    plan,
    email: "dev@adminer.test",
    role: "owner",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hours
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
    
  return jwt;
}

async function main() {
  console.log('🔑 Generating Clerk JWT tokens for smoke testing...\n');
  
  try {
    // Generate tokens for each plan
    const freeToken = await generateToken('test-user-free', 'org_free_demo', 'free');
    const proToken = await generateToken('test-user-pro', 'org_pro_demo', 'pro');
    const entToken = await generateToken('test-user-ent', 'org_ent_demo', 'enterprise');
    
    console.log('✅ Tokens generated successfully!\n');
    
    // Output in format ready for smoke-local.env
    console.log('📝 Copy these into your scripts/smoke-local.env file:\n');
    console.log(`CLERK_JWT_FREE="${freeToken}"`);
    console.log(`CLERK_JWT_PRO="${proToken}"`);
    console.log(`CLERK_JWT_ENT="${entToken}"`);
    
    console.log('\n🔒 Token expiration: 2 hours from now');
    console.log('💡 Re-run this script when tokens expire');
    
  } catch (error) {
    console.error('❌ Error generating tokens:', error.message);
    process.exit(1);
  }
}

main(); 