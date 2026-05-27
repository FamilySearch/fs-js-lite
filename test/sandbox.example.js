/**
 * FamilySearch Sandbox Credentials Template
 *
 * Copy this file to sandbox.js and fill in your credentials:
 *   cp test/sandbox.example.js test/sandbox.js
 *
 * Note: sandbox.js is gitignored to protect your credentials
 */

module.exports = {
  // Get your app key from: https://www.familysearch.org/developers/
  // This default matches the app key used in pre-recorded test fixtures
  appkey: process.env.FS_APPKEY || 'a02j000000JBxOxAAL',

  // Sandbox test account credentials (not currently used)
  username: process.env.FS_USERNAME || 'YOUR_USERNAME_HERE',
  password: process.env.FS_PASSWORD || 'YOUR_PASSWORD_HERE',

  // Access token for re-recording fixtures (OPTIONAL - only needed for npm run test:record)
  // Get token by:
  //   1. Go to https://integration.familysearch.org
  //   2. Sign in with test account
  //   3. DevTools > Application > Cookies > Copy 'fssessionid' value
  // Note: Tokens expire after ~1 hour, so get a fresh one each time you record
  accessToken: process.env.FS_ACCESS_TOKEN || undefined
};
