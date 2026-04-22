/**
 * PKCE (Proof Key for Code Exchange) Helper Functions
 *
 * PKCE is a security extension for OAuth 2.0 that prevents authorization code
 * interception attacks. It works by creating a cryptographic link between the
 * initial authorization request and the token exchange.
 *
 * These functions work in both Node.js and browser environments.
 */

/**
 * Generate a cryptographically random code verifier for PKCE
 *
 * The code verifier is a random string between 43-128 characters that uses
 * the characters A-Z, a-z, 0-9, and the punctuation characters -._~ (hyphen,
 * period, underscore, and tilde), as defined by RFC 7636.
 *
 * Security Note: This uses crypto.randomBytes() in Node.js and
 * crypto.getRandomValues() in browsers to ensure cryptographic randomness.
 * Never use Math.random() for security-sensitive values!
 *
 * @return {String} A random code verifier string (43 characters)
 */
function generateCodeVerifier() {
  // We need 32 random bytes, which when base64url-encoded gives us 43 characters
  var randomBytes;

  // Check if we're in Node.js environment
  if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js: use crypto.randomBytes()
    var crypto = require('crypto');
    randomBytes = crypto.randomBytes(32);
  }
  // Check if we're in a browser with Web Crypto API
  else if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser: use window.crypto.getRandomValues()
    var array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    randomBytes = array;
  }
  // Fallback error if neither is available
  else {
    throw new Error('No secure random number generator available. PKCE requires crypto support.');
  }

  // Convert bytes to base64url encoding
  // Base64url is like base64 but replaces + with -, / with _, and removes = padding
  return base64UrlEncode(randomBytes);
}

/**
 * Generate the code challenge from a code verifier
 *
 * The code challenge is a SHA256 hash of the code verifier, base64url-encoded.
 * This is sent to the authorization server, which stores it. Later, when we
 * exchange the authorization code for a token, we send the original verifier
 * and the server hashes it to verify it matches the challenge.
 *
 * @param {String} verifier The code verifier string
 * @return {String} The base64url-encoded SHA256 hash of the verifier
 */
function generateCodeChallenge(verifier) {
  // Check if we're in Node.js environment
  if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js: use crypto.createHash()
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
  }
  // Check if we're in a browser with Web Crypto API
  else if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser: use SubtleCrypto.digest()
    // Note: This is async in browsers, but we'll handle that when we call it
    throw new Error('Browser environment detected. Use generateCodeChallengeAsync() for browser support.');
  }
  // Fallback error
  else {
    throw new Error('No SHA256 implementation available. PKCE requires crypto support.');
  }
}

/**
 * Generate the code challenge from a code verifier (async version for browsers)
 *
 * Browsers require async crypto operations, so this returns a Promise.
 * In Node.js, this still works but is unnecessary (use generateCodeChallenge instead).
 *
 * @param {String} verifier The code verifier string
 * @return {Promise<String>} Promise that resolves to the base64url-encoded SHA256 hash
 */
function generateCodeChallengeAsync(verifier) {
  // Check if we're in Node.js environment
  if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js: just call the sync version and wrap in a Promise
    return Promise.resolve(generateCodeChallenge(verifier));
  }
  // Browser: use async SubtleCrypto API
  else if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Convert string to Uint8Array for hashing
    var encoder = new TextEncoder();
    var data = encoder.encode(verifier);

    // Hash with SHA-256
    return window.crypto.subtle.digest('SHA-256', data).then(function(hashBuffer) {
      // Convert ArrayBuffer to Uint8Array
      var hashArray = new Uint8Array(hashBuffer);
      return base64UrlEncode(hashArray);
    });
  }
  // Fallback error
  else {
    return Promise.reject(new Error('No SHA256 implementation available. PKCE requires crypto support.'));
  }
}

/**
 * Base64url encode a byte array
 *
 * Base64url encoding is like standard base64 but with URL-safe characters:
 * - Replaces + with -
 * - Replaces / with _
 * - Removes = padding
 *
 * This is required by the OAuth 2.0 PKCE specification (RFC 7636).
 *
 * @param {Buffer|Uint8Array} buffer The bytes to encode
 * @return {String} Base64url-encoded string
 */
function base64UrlEncode(buffer) {
  // Convert buffer to base64
  var base64;

  if (typeof Buffer !== 'undefined' && buffer instanceof Buffer) {
    // Node.js Buffer
    base64 = buffer.toString('base64');
  } else {
    // Browser Uint8Array - convert to string then base64
    var binary = '';
    var bytes = new Uint8Array(buffer);
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }

  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')  // Replace + with -
    .replace(/\//g, '_')  // Replace / with _
    .replace(/=/g, '');   // Remove padding =
}

// Export functions
module.exports = {
  generateCodeVerifier: generateCodeVerifier,
  generateCodeChallenge: generateCodeChallenge,
  generateCodeChallengeAsync: generateCodeChallengeAsync
};