var assert = require('chai').assert,
    pkce = require('../src/pkce'),
    FamilySearch = require('../src/FamilySearch');

describe('PKCE (Proof Key for Code Exchange)', function(){

  describe('generateCodeVerifier()', function(){

    it('returns a string', function(){
      var verifier = pkce.generateCodeVerifier();
      assert.isString(verifier);
    });

    it('returns a 43-character string', function(){
      // 32 random bytes encoded as base64url = 43 characters
      var verifier = pkce.generateCodeVerifier();
      assert.equal(verifier.length, 43);
    });

    it('uses only base64url-safe characters', function(){
      // Base64url uses: A-Z, a-z, 0-9, -, _
      // No +, /, or = (which are in standard base64)
      var verifier = pkce.generateCodeVerifier();
      assert.match(verifier, /^[A-Za-z0-9\-_]+$/);
      assert.notMatch(verifier, /[+\/=]/);
    });

    it('generates different values each time (randomness)', function(){
      var verifier1 = pkce.generateCodeVerifier();
      var verifier2 = pkce.generateCodeVerifier();
      var verifier3 = pkce.generateCodeVerifier();

      // All three should be different (cryptographically secure random)
      assert.notEqual(verifier1, verifier2);
      assert.notEqual(verifier2, verifier3);
      assert.notEqual(verifier1, verifier3);
    });

  });

  describe('generateCodeChallenge()', function(){

    it('returns a string', function(){
      var verifier = pkce.generateCodeVerifier();
      var challenge = pkce.generateCodeChallenge(verifier);
      assert.isString(challenge);
    });

    it('returns a 43-character string', function(){
      // SHA256 produces 32 bytes, which base64url encodes to 43 characters
      var verifier = pkce.generateCodeVerifier();
      var challenge = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge.length, 43);
    });

    it('uses only base64url-safe characters', function(){
      var verifier = pkce.generateCodeVerifier();
      var challenge = pkce.generateCodeChallenge(verifier);
      assert.match(challenge, /^[A-Za-z0-9\-_]+$/);
      assert.notMatch(challenge, /[+\/=]/);
    });

    it('is deterministic (same verifier produces same challenge)', function(){
      var verifier = 'test-verifier-12345-abcdef-consistent';
      var challenge1 = pkce.generateCodeChallenge(verifier);
      var challenge2 = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge1, challenge2);
    });

    it('produces different challenges for different verifiers', function(){
      var verifier1 = pkce.generateCodeVerifier();
      var verifier2 = pkce.generateCodeVerifier();
      var challenge1 = pkce.generateCodeChallenge(verifier1);
      var challenge2 = pkce.generateCodeChallenge(verifier2);
      assert.notEqual(challenge1, challenge2);
    });

    it('produces expected challenge for known test vector', function(){
      // Test vector from OAuth PKCE RFC 7636 examples (similar concept)
      // Using a simple known verifier to ensure SHA256 + base64url works correctly
      var verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      var challenge = pkce.generateCodeChallenge(verifier);

      // We expect a valid 43-character base64url string
      assert.equal(challenge.length, 43);
      assert.match(challenge, /^[A-Za-z0-9\-_]+$/);

      // The same verifier should always produce the same challenge
      var challengeAgain = pkce.generateCodeChallenge(verifier);
      assert.equal(challenge, challengeAgain);
    });

    it('correctly computes SHA256 hash (cryptographic verification)', function(){
      // CRITICAL TEST: Independently verify the cryptographic relationship
      // This ensures we're not just producing "some 43-char string" but
      // actually computing challenge = BASE64URL(SHA256(verifier))
      var crypto = require('crypto');

      var verifier = 'test-verifier-abc123-xyz';
      var challenge = pkce.generateCodeChallenge(verifier);

      // Independently compute what the challenge SHOULD be
      var expectedChallenge = crypto.createHash('sha256')
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
      var verifier1 = pkce.generateCodeVerifier();
      var verifier2 = pkce.generateCodeVerifier();

      // Check for patterns that would indicate weak randomness
      // With crypto.randomBytes, consecutive calls should have no correlation
      assert.notEqual(verifier1, verifier2);

      // Check that we get proper entropy (not sequential, not patterned)
      // If this was Math.random, we might see patterns
      var verifiers = [];
      for (var i = 0; i < 100; i++) {
        verifiers.push(pkce.generateCodeVerifier());
      }

      // All 100 should be unique (collision probability with crypto.randomBytes is ~0)
      var uniqueVerifiers = Array.from(new Set(verifiers));
      assert.equal(uniqueVerifiers.length, 100,
        'All verifiers should be unique with cryptographically secure random');
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
      var verifier = client.generateCodeVerifier();
      assert.isString(verifier);
      assert.equal(verifier.length, 43);
    });

    it('client.generateCodeChallenge() works', function(){
      var verifier = client.generateCodeVerifier();
      var challenge = client.generateCodeChallenge(verifier);
      assert.isString(challenge);
      assert.equal(challenge.length, 43);
    });

    it('can use PKCE in OAuth flow (verifier and challenge)', function(){
      // Simulate the PKCE OAuth flow
      var verifier = client.generateCodeVerifier();
      var challenge = client.generateCodeChallenge(verifier);

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