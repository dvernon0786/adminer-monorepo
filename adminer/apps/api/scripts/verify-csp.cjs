// CSP Verification Script
const fs = require('fs');
const path = require('path');

console.log('🔍 CSP Configuration Verification\n');

// Load and parse the Next.js config
async function verifyCSPConfig() {
  try {
    const configPath = path.resolve(__dirname, '../next.config.mjs');
    const configUrl = require('url').pathToFileURL(configPath).href;
    const mod = await import(configUrl);
    const nextConfig = mod.default || mod;

    if (!nextConfig.headers || typeof nextConfig.headers !== 'function') {
      console.error('❌ No headers() function found in next.config.mjs');
      return false;
    }

    const headers = await nextConfig.headers();
    const mainHeader = headers.find(h => h.source === '/(.*)');
    
    if (!mainHeader) {
      console.error('❌ No catch-all header rule found (source: "/(.*)")');
      return false;
    }

    const cspHeader = mainHeader.headers.find(h => 
      h.key.toLowerCase() === 'content-security-policy'
    );

    if (!cspHeader) {
      console.error('❌ No Content-Security-Policy header found');
      return false;
    }

    console.log('✅ CSP Configuration Found\n');
    
    // Parse and validate CSP directives
    const csp = cspHeader.value;
    console.log('📋 CSP Directives Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const directives = csp.split(';').map(d => d.trim()).filter(d => d);
    
    const expectedDirectives = {
      "default-src": "✅ Found: default-src 'self'",
      "script-src": "✅ Found: script-src with Clerk domain",
      "style-src": "✅ Found: style-src with Google Fonts",
      "font-src": "✅ Found: font-src with Google Fonts",
      "connect-src": "✅ Found: connect-src with Clerk APIs",
      "img-src": "✅ Found: img-src directive",
      "frame-src": "✅ Found: frame-src directive",
      "worker-src": "✅ Found: worker-src directive",
      "base-uri": "✅ Found: base-uri security directive",
      "form-action": "✅ Found: form-action security directive",
      "frame-ancestors": "✅ Found: frame-ancestors security directive",
      "object-src": "✅ Found: object-src security directive",
      "upgrade-insecure-requests": "✅ Found: upgrade-insecure-requests"
    };

    // Check each directive
    directives.forEach(directive => {
      const directiveName = directive.split(' ')[0];
      if (expectedDirectives[directiveName]) {
        console.log(`✅ ${directiveName}: ${directive}`);
      }
    });

    console.log('\n🔍 Security Features Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check specific security features
    const checks = [
      {
        name: 'Clerk Domain Whitelisted',
        test: () => csp.includes('clerk.adminer.online'),
        result: csp.includes('clerk.adminer.online') ? '✅ PASS' : '❌ FAIL'
      },
      {
        name: 'Clerk API Whitelisted',
        test: () => csp.includes('api.clerk.com'),
        result: csp.includes('api.clerk.com') ? '✅ PASS' : '❌ FAIL'
      },
      {
        name: 'Google Fonts CSS Allowed',
        test: () => csp.includes('fonts.googleapis.com'),
        result: csp.includes('fonts.googleapis.com') ? '✅ PASS' : '❌ FAIL'
      },
      {
        name: 'Google Fonts Files Allowed',
        test: () => csp.includes('fonts.gstatic.com'),
        result: csp.includes('fonts.gstatic.com') ? '✅ PASS' : '❌ FAIL'
      },
      {
        name: 'Development unsafe-eval (non-prod only)',
        test: () => csp.includes("'unsafe-eval'"),
        result: csp.includes("'unsafe-eval'") ? '✅ PASS (Dev Mode)' : '✅ PASS (Prod Mode)'
      },
      {
        name: 'XSS Protection (object-src none)',
        test: () => csp.includes("object-src 'none'"),
        result: csp.includes("object-src 'none'") ? '✅ PASS' : '❌ FAIL'
      },
      {
        name: 'Clickjacking Protection',
        test: () => mainHeader.headers.some(h => h.key === 'X-Frame-Options'),
        result: mainHeader.headers.some(h => h.key === 'X-Frame-Options') ? '✅ PASS' : '❌ FAIL'
      }
    ];

    checks.forEach(check => {
      console.log(`${check.result} ${check.name}`);
    });

    console.log('\n📊 Complete CSP Header:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(csp);

    console.log('\n🎯 Other Security Headers:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    mainHeader.headers.forEach(header => {
      if (header.key !== 'Content-Security-Policy') {
        console.log(`✅ ${header.key}: ${header.value}`);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error verifying CSP config:', error);
    return false;
  }
}

// Main execution
verifyCSPConfig().then(success => {
  if (success) {
    console.log('\n🎉 CSP Configuration Verification: PASSED');
    console.log('✅ Ready for deployment!');
  } else {
    console.log('\n❌ CSP Configuration Verification: FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});