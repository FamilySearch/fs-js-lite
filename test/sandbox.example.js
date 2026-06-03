/**
 * FamilySearch Sandbox Credentials Template
 *
 * Copy this file to sandbox.js and fill in your credentials:
 *   cp test/sandbox.example.js test/sandbox.js
 *
 * Note: sandbox.js is gitignored to protect your credentials
 */

export default {
  // Get your app key from: https://www.familysearch.org/developers/
  // Beta environment app key (integration uses a02j000000JBxOxAAL)
  appkey: process.env.FS_APPKEY || 'a02j000000KRNxqAAH',

  // Sandbox test account credentials (not currently used)
  username: process.env.FS_USERNAME || 'YOUR_USERNAME_HERE',
  password: process.env.FS_PASSWORD || 'YOUR_PASSWORD_HERE',

  // Access token for re-recording fixtures (OPTIONAL - only needed for npm run test:record)
  // Get token by:
  //   1. Go to https://beta.familysearch.org/platform
  //   2. Click the "Authenticate" button
  //   3. Click the clipboard icon next to the access token to copy it
  // Note: Tokens expire after ~1 hour, so get a fresh one each time you record
  accessToken: process.env.FS_ACCESS_TOKEN || undefined
};
