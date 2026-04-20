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
  appkey: process.env.FS_APPKEY || 'YOUR_APP_KEY_HERE',

  // Sandbox test account credentials
  username: process.env.FS_USERNAME || 'YOUR_USERNAME_HERE',
  password: process.env.FS_PASSWORD || 'YOUR_PASSWORD_HERE'
};
