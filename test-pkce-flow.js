/**
 * Manual PKCE Flow Test
 *
 * This script tests whether FamilySearch OAuth integration endpoint
 * fully supports PKCE. Run this to verify before enforcing PKCE in v3.0.0.
 *
 * Usage:
 *   node test-pkce-flow.js
 */

var FamilySearch = require('./src/FamilySearch');

// Load sandbox config
var sandbox;
try {
  sandbox = require('./test/sandbox');
} catch (e) {
  sandbox = require('./test/sandbox.example');
}

console.log('\n=== FamilySearch PKCE Flow Test ===\n');

// Create client (change environment as needed: 'production', 'beta', or 'integration')
var client = new FamilySearch({
  appKey: sandbox.appkey,
  environment: 'beta',  // Change to 'production' or 'integration' as needed
  redirectUri: 'http://localhost:3000/oauth-callback' // Change this if you have a different callback
});

// Step 1: Generate PKCE parameters
console.log('Step 1: Generating PKCE parameters...');
var verifier = client.generateCodeVerifier();
var challenge = client.generateCodeChallenge(verifier);

console.log('  ✓ Code Verifier:', verifier);
console.log('  ✓ Code Challenge:', challenge);
console.log('  ✓ Length check:', verifier.length === 43 && challenge.length === 43 ? 'PASS' : 'FAIL');

// Step 2: Build OAuth URL with PKCE
console.log('\nStep 2: Building OAuth URL with PKCE...');
var oauthUrl = client.oauthRedirectURL({
  state: 'test-state-' + Date.now(),
  codeChallenge: challenge
});

console.log('  ✓ OAuth URL:', oauthUrl);

// Verify URL contains PKCE parameters
var hasChallengeParam = oauthUrl.includes('code_challenge=' + encodeURIComponent(challenge));
var hasChallengeMethod = oauthUrl.includes('code_challenge_method=S256');

console.log('  ✓ Contains code_challenge:', hasChallengeParam ? 'YES' : 'NO');
console.log('  ✓ Contains code_challenge_method=S256:', hasChallengeMethod ? 'YES' : 'NO');

// Step 3: Manual OAuth Flow Instructions
console.log('\n=== MANUAL TEST REQUIRED ===\n');
console.log('To complete this test, you need to:');
console.log('\n1. Open this URL in your browser:');
console.log('\n   ' + oauthUrl + '\n');
console.log('2. Sign in with your FamilySearch beta account');
console.log('3. After redirect, copy the "code" parameter from the URL');
console.log('4. Run the verification step:\n');
console.log('   node test-pkce-flow.js verify <CODE>');
console.log('\nNote: This uses the beta environment (https://identbeta.familysearch.org)\n');

// Step 4: Verify token exchange (if code provided)
if (process.argv[2] === 'verify' && process.argv[3]) {
  var code = process.argv[3];

  console.log('\n=== Verifying Token Exchange with PKCE ===\n');
  console.log('Using code:', code);
  console.log('Using verifier:', verifier);

  client.oauthToken(code, verifier, function(error, response) {
    if (error) {
      console.error('\n❌ PKCE VERIFICATION FAILED');
      console.error('Error:', error);
      process.exit(1);
    }

    if (response && response.statusCode === 200 && response.data && response.data.access_token) {
      console.log('\n✅ PKCE FLOW WORKS!');
      console.log('\nToken exchange successful with PKCE!');
      console.log('Access token received:', response.data.access_token.substring(0, 20) + '...');
      console.log('\n🎉 FamilySearch OAuth supports PKCE - safe to enforce in v3.0.0!\n');
      process.exit(0);
    } else {
      console.error('\n❌ PKCE VERIFICATION FAILED');
      console.error('Response status:', response ? response.statusCode : 'N/A');
      console.error('Response body:', response ? response.body : 'N/A');
      process.exit(1);
    }
  });
} else if (process.argv[2] === 'verify') {
  console.error('❌ Error: Please provide the authorization code');
  console.error('Usage: node test-pkce-flow.js verify <CODE>');
  process.exit(1);
} else {
  console.log('💡 Tip: Keep this terminal open to reuse the verifier for step 4\n');
  console.log('Verifier for this session:', verifier, '\n');
}
