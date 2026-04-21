/**
 * FamilySearch Sandbox Credentials
 *
 * This file is gitignored. Use environment variables or update values here.
 *
 * To use environment variables:
 *   export FS_APPKEY='your-app-key'
 *   export FS_USERNAME='your-username'
 *   export FS_PASSWORD='your-password'
 */

module.exports = {
  // Get your app key from: https://www.developers.familysearch.org
  appkey: process.env.FS_APPKEY || 'a02j000000JBxOxAAL',

  // Sandbox test account credentials
  username: process.env.FS_USERNAME || 'sdktester',
  password: process.env.FS_PASSWORD || '1234sdkpass'
};