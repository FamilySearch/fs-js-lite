# FamilySearch SDK Demo Application

A simple, self-contained demo application showing how to use the fs-js-lite JavaScript SDK to interact with the FamilySearch API.

## What This Demo Shows

This application demonstrates:
- ✅ **OAuth 2.0 Authentication with PKCE** - Secure login flow following best practices
- ✅ **Getting Current User** - Fetch and display authenticated user information
- ✅ **Reading Tree Data** - Retrieve person details from the FamilySearch tree
- ✅ **Accessing Sources** - Fetch source information attached to persons

## Quick Start

### Prerequisites

1. **FamilySearch Developer Account** - Sign up at https://familysearch.org/developers/
2. **App Key** - Register an application to get your app key
3. **Redirect URI** - Configure your redirect URI in the developer portal

### Setup Instructions

1. **Get Your Credentials:**
   - Go to https://familysearch.org/developers/
   - Create a new application (or use an existing one)
   - Note your **App Key**
   - Add your redirect URI (e.g., `http://localhost:8080/examples/demo-app/index.html`)

2. **Configure the Demo:**
   - Open `index.html` in a text editor
   - Find the configuration section at the top of the `<script>` tag
   - Replace `YOUR_APP_KEY_HERE` with your actual app key
   - Update the `redirectUri` to match your setup

3. **Build the SDK:**
   ```bash
   # From the root of fs-js-lite repository
   npm install
   npm run build
   ```
   This creates `dist/FamilySearch.min.js` that the demo loads.

4. **Run the Demo:**
   - **Option A - Local File:** Simply open `index.html` in your browser
   - **Option B - Local Server (Recommended):** 
     ```bash
     # From the root of fs-js-lite repository
     npx http-server -p 8080
     # Then open: http://localhost:8080/examples/demo-app/index.html
     ```

### Why Use a Local Server?

While you CAN open the HTML file directly (`file://`), using a local web server is better because:
- Cookies work properly (OAuth token storage)
- Mimics a real production environment
- Avoids CORS issues with some browsers

## How to Use the Demo

1. **Click "Login with FamilySearch"** - You'll be redirected to FamilySearch to authenticate
2. **Authorize the App** - Grant permissions when prompted
3. **View Your Profile** - After redirect, your user info displays automatically
4. **Explore the Tree:**
   - Enter a Person ID (e.g., `KWQS-BBQ`)
   - Click "Get Person" to see their details
   - Click "Get Sources" to see attached sources

## Code Structure

```
examples/demo-app/
├── README.md          # This file - setup instructions
├── index.html         # Main demo app (HTML + JavaScript)
└── styles.css         # Styling for the demo
```

**Why everything is in one HTML file:**
- Easy to understand - no application bundler or framework needed
- Copy-paste friendly - users can grab code snippets
- Quick to modify and experiment with

**Note:** While the demo itself has no build process, the SDK must be built first to generate `dist/FamilySearch.min.js`.

**How to learn from this demo:**
1. **Run it** - See the features in action
2. **Read this README** - Understand the concepts and see code snippets
3. **View the source** - Open `index.html` in your editor to see real implementations with detailed comments
4. **Copy patterns** - Use the code as a starting point for your own app

The `index.html` file is heavily commented with explanations of WHY we do things certain ways, not just WHAT the code does. It's designed to be read and learned from!

## Learning Points

### 1. PKCE Flow (Proof Key for Code Exchange)

This demo uses PKCE for security. Here's what happens:

```javascript
// Generate a random verifier
const verifier = fs.generateCodeVerifier();

// Create a challenge from the verifier
// Note: Use the ASYNC version in browsers (uses Web Crypto API)
const challenge = await fs.generateCodeChallengeAsync(verifier);

// Store verifier for later (OAuth callback needs it)
sessionStorage.setItem('pkce_verifier', verifier);

// Start OAuth with the challenge
fs.oauthRedirect({ codeChallenge: challenge });
```

**Why PKCE matters:** It prevents authorization code interception attacks. Even if someone steals your auth code, they can't use it without the verifier.

### 2. Handling OAuth Callbacks

After FamilySearch redirects back, we need to:
1. Extract the authorization code from the URL
2. Retrieve the PKCE verifier we stored earlier
3. Exchange the code + verifier for an access token

```javascript
const verifier = sessionStorage.getItem('pkce_verifier');
fs.oauthToken(code, verifier, callback);
```

### 3. Making API Requests

Once authenticated, all requests are simple:

```javascript
fs.get('/platform/users/current', (error, response) => {
  if (error) {
    console.error('Network error:', error);
  } else if (response.statusCode >= 400) {
    console.error('API error:', response.statusCode);
  } else {
    console.log('Success:', response.data);
  }
});
```

**Want more examples?** Check these functions in `index.html`:
- `fetchCurrentUser()` - Get authenticated user info
- `fetchPerson(personId)` - Get person details from the tree
- `fetchSources(personId)` - Get sources attached to a person

Each function shows proper error handling and response parsing!

## Testing with Different Environments

By default, this demo uses the **beta** environment. To test against production:

```javascript
const fs = new FamilySearch({
  environment: 'production',  // Options: 'production' or 'beta'
  appKey: 'YOUR_APP_KEY',
  // ... rest of config
});
```

**Development workflow:**
- Use `beta` for development and testing (test data, safe to experiment)
- Use `production` only for live applications with real user data

## Common Issues

### "Authentication failed" or token errors
- ✅ Check your app key is correct
- ✅ Verify your redirect URI matches exactly (including http/https)
- ✅ Make sure cookies are enabled in your browser
- ✅ Clear sessionStorage and cookies, then try again

### "Person not found" errors
- ✅ Person IDs are environment-specific (an ID in `beta` won't work in `production`)
- ✅ Try using your own Person ID by clicking "Use My Person ID" after logging in

### Cookies not saving
- ✅ Use a local web server instead of opening the file directly
- ✅ For local development, set `secureCookies: false` in the config

## Next Steps

Want to build on this demo? Try:
- Adding search functionality
- Displaying a pedigree chart
- Showing multiple generations
- Adding write operations (with proper error handling)
- Integrating with a modern framework (React, Vue, etc.)

## Resources

- [fs-js-lite Documentation](../../README.md) - SDK usage and configuration
- [FamilySearch API Reference](https://developers.familysearch.org/main/reference/api-reference-guide) - Complete API documentation with interactive testing
- [FamilySearch Developer Portal](https://familysearch.org/developers/) - Register apps and get API keys
- [OAuth 2.0 with PKCE](https://oauth.net/2/pkce/) - Security specification

## Questions?

- **SDK Issues:** Open an issue at https://github.com/FamilySearch/fs-js-lite/issues
- **API Questions:** Visit https://familysearch.org/developers/