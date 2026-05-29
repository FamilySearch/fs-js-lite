# PKCE OAuth Flow Test

This test verifies that FamilySearch OAuth supports PKCE (Proof Key for Code Exchange), which is required by OAuth 2.1.

## Prerequisites

- Node.js installed
- Access to FamilySearch test account

## Quick Start

### 1. Get the Code
```bash
npm install
```

### 2. Start the Test Server
```bash
node test-server.js
```

**Expected output:**
```
=== PKCE Test Server Running ===
Server running at http://127.0.0.1:8080/
```

**Keep this terminal window open.**

### 3. Open the Test Page

Open your browser and go to: **http://127.0.0.1:8080/**

### 4. Configure the Test

The page should have these pre-filled:
- **App Key**: `a02j000000JBxOxAAL` (default - replace with your app key if needed)
- **Redirect URI**: `http://127.0.0.1:8080`
- **Environment**: Select **Production**, **Beta**, or **Integration** from dropdown

**Note:** You may need to use a different app key depending on your environment and registered redirect URIs. Different app keys are typically registered for each environment.

### 5. Run the PKCE Flow

**Step 5a:** Click **"Start PKCE OAuth Flow"**
- You'll see generated PKCE parameters displayed (verifier and challenge)
- After 2 seconds, browser will redirect to FamilySearch login

**Step 5b:** Sign in to FamilySearch with test credentials

**Step 5c:** After redirect, you'll be back at the test page
- The URL will contain a `code=` parameter

**Step 5d:** Click **"Handle OAuth Callback (PKCE)"**

### 6. Check the Result

**✅ SUCCESS:**
```
🎉 PKCE FLOW SUCCESSFUL!

✅ FamilySearch OAuth supports PKCE
✅ Code exchange with verifier worked
✅ Access token received: [token preview]

Conclusion: Safe to enforce PKCE in v3.0.0!
```

**❌ FAILURE:**
- Red error box with error message
- Check the "Debug Log" section at the bottom of the page for details

### 7. Stop the Server
Go back to the terminal and press `Ctrl+C`

---

## What This Test Verifies

1. ✅ PKCE code verifier generation (cryptographically random)
2. ✅ PKCE code challenge generation (SHA256 hash)
3. ✅ FamilySearch OAuth accepts `code_challenge` parameter
4. ✅ FamilySearch OAuth accepts `code_verifier` parameter
5. ✅ FamilySearch OAuth verifies the cryptographic relationship
6. ✅ Token exchange succeeds with PKCE

---

## Troubleshooting

### "Invalid client id"
- The app key is not registered for the selected environment
- Switch environments (Integration ↔ Beta) or check app key configuration

### "Redirect URI not configured correctly"
- The redirect URI in the test page doesn't match what's registered in the developer portal
- Contact the person who manages the app key to verify registered redirect URIs

### "Server Error: EISDIR" or "ERR_CONNECTION_REFUSED"
- Make sure `node test-server.js` is running in a terminal
- Check that no other process is using port 8080

### "This site can't be reached"
- Verify the redirect URI in the test page matches exactly: `http://127.0.0.1:8080` (no trailing slash)

---

## Technical Details

**What is PKCE?**

PKCE (Proof Key for Code Exchange) is a security extension for OAuth 2.0 that prevents authorization code interception attacks. It works by:

1. Client generates a random `code_verifier`
2. Client computes `code_challenge = BASE64URL(SHA256(code_verifier))`
3. Client sends `code_challenge` in authorization request
4. OAuth server stores the challenge
5. Client sends `code_verifier` in token exchange
6. OAuth server verifies: `SHA256(code_verifier) == stored_challenge`

**Why Test This?**

We need to verify that FamilySearch OAuth supports PKCE before enforcing it in v3.0.0. If PKCE works, we can make it mandatory and achieve OAuth 2.1 compliance.

---

## Files Involved

- `test-pkce-browser.html` - Interactive test page with PKCE flow
- `test-server.js` - Simple HTTP server to serve the test page
- `src/pkce.js` - PKCE implementation (verifier/challenge generation)
- `src/FamilySearch.js` - SDK OAuth methods with PKCE support

---

## Questions?

For questions or issues, please [open an issue on GitHub](https://github.com/FamilySearch/fs-js-lite/issues).