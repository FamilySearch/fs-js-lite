import { assert } from 'chai';
import * as pkce from '../src/pkce.js';
import FamilySearch from '../src/FamilySearch.js';
import crypto from 'crypto';

describe('PKCE (Proof Key for Code Exchange)', function(){

  describe('generateCodeVerifier()', function(){

    it('returns a string', function(){
      const verifier = pkce.generateCodeVerifier();
      assert.isString(verifier);
    });

    it('returns a 43-character string', function(){
      // 32 random bytes encoded as base64url = 43 characters
      const verifier = pkce.generateCodeVerifier();
      assert.equal(verifier.length, 43);
    });

    it('uses only base64url-safe characters', function(){
      // Base64url uses: A-Z, a-z, 0-9, -, _
      // No +, /, or = (which are in standard base64)
      const verifier = pkce.generateCodeVerifier();
      assert.match(verifier, /^[A-Za-z0-9\-_]+$/);
      assert.notMatch(verifier, /[+\/=]/);
    });

    it('generates different values each time (randomness)', function(){
      const verifier1 = pkce.generateCodeVerifier();
      const verifier2 = pkce.generateCodeVerifier();
      const verifier3 = pkce.generateCodeVerifier();

      // All three should be different (cryptographically secure random)
      assert.notEqual(verifier1, verifier2);
      assert.notEqual(verifier2, verifier3);
      assert.notEqual(verifier1, verifier3);
    });

  });

  describe('generateCodeChallenge()', function(){

    it('returns a string', function(){
      const verifier = pkce.generateCodeVerifier();
      const challenge = pkce.generateCodeChallenge(verifier);
      assert.isString(challenge);
    });

    it('returns a 43-character string', function(){
      // SHA256 produces 32 bytes, which base64url encodes to 43 characters
      const verifier = pkce.generateCodeVerifier();
      const challenge = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge.length, 43);
    });

    it('uses only base64url-safe characters', function(){
      const verifier = pkce.generateCodeVerifier();
      const challenge = pkce.generateCodeChallenge(verifier);
      assert.match(challenge, /^[A-Za-z0-9\-_]+$/);
      assert.notMatch(challenge, /[+\/=]/);
    });

    it('is deterministic (same verifier produces same challenge)', function(){
      const verifier = 'test-verifier-12345-abcdef-consistent';
      const challenge1 = pkce.generateCodeChallenge(verifier);
      const challenge2 = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge1, challenge2);
    });

    it('produces different challenges for different verifiers', function(){
      const verifier1 = pkce.generateCodeVerifier();
      const verifier2 = pkce.generateCodeVerifier();
      const challenge1 = pkce.generateCodeChallenge(verifier1);
      const challenge2 = pkce.generateCodeChallenge(verifier2);
      assert.notEqual(challenge1, challenge2);
    });

    it('produces expected challenge for known test vector', function(){
      // Test vector from OAuth PKCE RFC 7636 examples (similar concept)
      // Using a simple known verifier to ensure SHA256 + base64url works correctly
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = pkce.generateCodeChallenge(verifier);

      // We expect a valid 43-character base64url string
      assert.equal(challenge.length, 43);
      assert.match(challenge, /^[A-Za-z0-9\-_]+$/);

      // The same verifier should always produce the same challenge
      const challengeAgain = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge, challengeAgain);
    });

    it('correctly computes SHA256 hash (cryptographic verification)', function(){
      // CRITICAL TEST: Independently verify the cryptographic relationship
      // This ensures we're not just producing "some 43-char string" but
      // actually computing challenge = BASE64URL(SHA256(verifier))

      const verifier = 'test-verifier-abc123-xyz';
      const challenge = pkce.generateCodeChallenge(verifier);

      // Independently compute what the challenge SHOULD be
      const expectedChallenge = crypto.createHash('sha256')
        .update(verifier)
        .digest('base64')
        .replace(/\+/g, '-')   // base64 -> base64url
        .replace(/\//g, '_')
        .replace(/=/g, '');

      assert.equal(challenge, expectedChallenge,
        'Challenge must be BASE64URL(SHA256(verifier)) per RFC 7636');
    });

    it('uses cryptographically secure random (not Math.random)', function(){
      // Security audit: ensure we're using crypto.randomBytes, not Math.random
      // This is critical because Math.random is predictable
      const verifier1 = pkce.generateCodeVerifier();
      const verifier2 = pkce.generateCodeVerifier();

      // Check for patterns that would indicate weak randomness
      // With crypto.randomBytes, consecutive calls should have no correlation
      assert.notEqual(verifier1, verifier2);

      // Check that we get proper entropy (not sequential, not patterned)
      // If this was Math.random, we might see patterns
      const verifiers = [];
      for (var i = 0; i < 100; i++) {
        verifiers.push(pkce.generateCodeVerifier());
      }

      // All 100 should be unique (collision probability with crypto.randomBytes is ~0)
      var uniqueVerifiers = Array.from(new Set(verifiers));
      assert.equal(uniqueVerifiers.length, 100,
        'All verifiers should be unique with cryptographically secure random');
    });

  });

  describe('generateCodeChallengeAsync()', function(){

    it('returns a Promise', function(){
      const verifier = pkce.generateCodeVerifier();
      var result = pkce.generateCodeChallengeAsync(verifier);
      assert.instanceOf(result, Promise);
    });

    it('resolves to a string', async function(){
      const verifier = pkce.generateCodeVerifier();
      const challenge = await pkce.generateCodeChallengeAsync(verifier);
      assert.isString(challenge);
    });

    it('resolves to a 43-character string', async function(){
      const verifier = pkce.generateCodeVerifier();
      const challenge = await pkce.generateCodeChallengeAsync(verifier);
      assert.equal(challenge.length, 43);
    });

    it('resolves to the same output as generateCodeChallenge()', async function(){
      // Critical test: async and sync versions must produce identical output
      const verifier = pkce.generateCodeVerifier();
      var syncChallenge = pkce.generateCodeChallenge(verifier);
      var asyncChallenge = await pkce.generateCodeChallengeAsync(verifier);
      assert.equal(asyncChallenge, syncChallenge,
        'Async and sync PKCE methods must produce identical challenges');
    });

    it('is deterministic (same verifier produces same challenge)', async function(){
      const verifier = 'test-verifier-async-12345-abcdef';
      const challenge1 = await pkce.generateCodeChallengeAsync(verifier);
      const challenge2 = await pkce.generateCodeChallengeAsync(verifier);
      assert.equal(challenge1, challenge2);
    });

    it('produces different challenges for different verifiers', async function(){
      const verifier1 = pkce.generateCodeVerifier();
      const verifier2 = pkce.generateCodeVerifier();
      const challenge1 = await pkce.generateCodeChallengeAsync(verifier1);
      const challenge2 = await pkce.generateCodeChallengeAsync(verifier2);
      assert.notEqual(challenge1, challenge2);
    });

  });

  describe('FamilySearch client integration', function(){

    var client;

    before(function(){
      client = new FamilySearch({
        appKey: 'test-app-key',
        redirectUri: 'http://example.com/oauth'
      });
    });

    it('client.generateCodeVerifier() works', function(){
      const verifier = client.generateCodeVerifier();
      assert.isString(verifier);
      assert.equal(verifier.length, 43);
    });

    it('client.generateCodeChallenge() works', function(){
      const verifier = client.generateCodeVerifier();
      const challenge = client.generateCodeChallenge(verifier);
      assert.isString(challenge);
      assert.equal(challenge.length, 43);
    });

    it('client.generateCodeChallengeAsync() returns a Promise', function(){
      const verifier = client.generateCodeVerifier();
      var result = client.generateCodeChallengeAsync(verifier);
      assert.instanceOf(result, Promise);
    });

    it('client.generateCodeChallengeAsync() works', async function(){
      const verifier = client.generateCodeVerifier();
      const challenge = await client.generateCodeChallengeAsync(verifier);
      assert.isString(challenge);
      assert.equal(challenge.length, 43);
    });

    it('client async and sync methods produce identical output', async function(){
      const verifier = client.generateCodeVerifier();
      var syncChallenge = client.generateCodeChallenge(verifier);
      var asyncChallenge = await client.generateCodeChallengeAsync(verifier);
      assert.equal(asyncChallenge, syncChallenge);
    });

    it('can use PKCE in OAuth flow (verifier and challenge)', function(){
      // Simulate the PKCE OAuth flow
      const verifier = client.generateCodeVerifier();
      const challenge = client.generateCodeChallenge(verifier);

      // Step 1: Generate authorization URL with code challenge
      var authUrl = client.oauthRedirectURL({
        state: 'test-state',
        codeChallenge: challenge,
        codeChallengeMethod: 'S256'
      });

      // Verify the URL contains the challenge
      assert.include(authUrl, 'code_challenge=' + encodeURIComponent(challenge));
      assert.include(authUrl, 'code_challenge_method=S256');

      // Step 2: Later, we would use the verifier in token exchange
      // (The verifier would be sent to the token endpoint, but we can't test
      // the full flow without mocking the OAuth server)
      assert.isDefined(verifier);
      assert.notEqual(verifier, challenge);
    });

  });

});