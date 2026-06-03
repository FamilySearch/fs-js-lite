# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-01

### Breaking Changes

#### ES6 Module Syntax

**Package now uses ES6 modules (`"type": "module"` in package.json):**

- **CommonJS consumers (Node.js `require()`):** Breaking change - `require('fs-js-lite')` will fail. You must migrate to ESM imports (`import FamilySearch from 'fs-js-lite'`) or use dynamic imports (`await import('fs-js-lite')`).
- **Browser UMD bundle:** No breaking changes - continues to work as before
- **ES6 module consumers:** No breaking changes - improved compatibility

**Codebase upgraded from ES5 to ES6** for modern JavaScript standards:

- **`const`/`let`** instead of `var`
- **ES6 `import`/`export`** instead of CommonJS `require`/`module.exports`
- **Arrow functions** for cleaner syntax
- **Template literals** for string interpolation
- **ES6 classes** instead of prototype-based constructors
- **Destructuring** and other modern JavaScript features

**Impact:**
- ⚠️ **Node.js CommonJS users:** Must migrate to ESM or use dynamic imports
- ✅ **Browser users:** No changes needed - UMD bundle still works
- ✅ **Node.js ESM users:** Improved compatibility
- ✅ **Node.js:** Requires Node.js 20+ (already required)
- ✅ **Build:** Webpack configuration updated for ES6 modules
- ✅ **Tests:** All 55 tests passing (42 Node.js + 13 browser)

**For developers:**
- Source code now uses modern ES6 syntax
- `package.json` includes `"type": "module"` for ES6 modules
- Switched from `nyc` to `c8` for code coverage (ES6 module support)
- Better compatibility with modern tooling and linting standards
- Helper scripts (test-server.js, test-pkce-*.js) converted to ESM

#### Secure Cookie Defaults

**Cookies now default to secure settings** to protect against common web vulnerabilities:

- **`secure: true`** - Cookies only sent over HTTPS (prevents network eavesdropping)
- **`sameSite: 'strict'`** - Cookies not sent with cross-site requests (CSRF protection)
- **`path: '/'`** - Cookies available across your entire domain (improved from v2.x behavior)

**Impact:**
- ✅ **Production apps on HTTPS:** No code changes required! You automatically get improved security.
- ⚠️ **Local development on HTTP:** Add `secureCookies: false` to your configuration.

```javascript
// Local development (HTTP) - Add secureCookies: false
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false  // Required for http://localhost
});

// Production (HTTPS) - No changes needed!
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true
  // Secure defaults automatically applied
});
```

### Added

#### New Configuration Options

- **`secureCookies`** (Boolean) - Control whether cookies require HTTPS. Defaults to `true`. Set to `false` only for local development over HTTP.
- **`sameSite`** (String) - SameSite cookie attribute for CSRF protection. Defaults to `'strict'`. Options: `'strict'`, `'lax'`, or `'none'`.
- **`tokenCookiePath`** - Now explicitly defaults to `'/'` instead of current path (improved behavior for most applications).
- **`allowedRedirectDomains`** (Array) - Configure which domains automatic redirects can follow (when `followRedirect` option is used). Defaults to FamilySearch domains. Customize for integrations that need redirects to other trusted domains. Set to `null` to disable validation.

#### PKCE Support

Added OAuth 2.0 PKCE (Proof Key for Code Exchange) helper methods for enhanced security:

- **`generateCodeVerifier()`** - Generate cryptographically secure code verifier
- **`generateCodeChallenge(verifier)`** - Compute SHA-256 code challenge from verifier
- **`oauthRedirectURL({ state, codeChallenge })`** - Build OAuth URL with PKCE parameters
- **`oauthToken(code, verifier, callback)`** - Exchange authorization code with PKCE verifier

PKCE is recommended for all OAuth flows, especially public clients. See [TEST-PKCE-FLOW.md](./TEST-PKCE-FLOW.md) for usage examples.

#### New Documentation

- **[MIGRATION-v3.md](./MIGRATION-v3.md)** - Complete migration guide with detailed scenarios, troubleshooting, and rollback instructions
- **[SECURITY.md](./SECURITY.md)** - Security best practices and configuration guidance
- **[TEST-PKCE-FLOW.md](./TEST-PKCE-FLOW.md)** - PKCE implementation guide and testing utilities

#### Testing Utilities

- **`test-pkce-browser.html`** - Interactive browser-based PKCE flow tester
- **`test-pkce-simple.js`** - Simple Node.js PKCE verification script
- **`test-pkce-flow.js`** - Comprehensive PKCE flow testing tool
- **`test-server.js`** - Local development server for testing OAuth flows

### Security

- **Enhanced token storage security** - Secure cookie defaults protect against XSS and CSRF attacks
- **Addressed CodeQL security findings:**
  - Fixed DOM text reinterpreted as HTML
  - Fixed uncontrolled data used in path expression
  - Fixed exception text reinterpreted as HTML
- **httpOnly cookies** - When combined with secure defaults, provides comprehensive protection against token theft
- **Protected against ReDoS attacks** - Query parameter parsing now escapes regex special characters
- **Open redirect protection** - Configurable domain whitelist for automatic redirects (defaults to FamilySearch domains)
- **HTTPS downgrade prevention** - Blocks redirects from HTTPS to HTTP
- **Better error handling** - JSON parse errors now reported instead of silently ignored

### Changed

- **Cookie path default** - `tokenCookiePath` now defaults to `'/'` instead of current path, making tokens available across your entire domain (improved behavior)
- **Enhanced browser cookie tests** - Comprehensive test coverage for secure cookie flags (12 tests covering all security scenarios)

### Migration Guide

**Most production apps need zero code changes** if running on HTTPS! 🎉

See [MIGRATION-v3.md](./MIGRATION-v3.md) for:
- Step-by-step migration instructions
- Common scenarios (production, local dev, cross-site auth)
- Testing checklist
- Troubleshooting guide
- Rollback instructions (if needed)

**Quick migration for local development:**
```javascript
// Just add secureCookies: false for http://localhost
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false
});
```

### Compatibility

- Requires Node.js 14.0.0 or higher
- Existing SDK methods remain available, but some applications may require configuration updates due to the new secure cookie defaults
- No SDK method removals are introduced in this release; review the migration guidance above for local HTTP development and PKCE recommendations

---

## [2.7.0] - 2026-04-10

### Changed

#### Build Tools
- Updated webpack from 4.35.3 to 5.106.1
- Updated webpack-cli from 3.3.6 to 7.0.2
- Created webpack.config.js for webpack 5 compatibility
- Updated build scripts to use webpack 5 API

#### Testing Dependencies
- Updated mocha from 8.1.1 to 11.7.5
- Updated chai from 3.5.0 to 6.2.2
- Updated jsdom from 16.5.0 to 29.0.2
- Migrated test code to jsdom 29 API (createCookieJar, VirtualConsole, script loading)
- Replaced istanbul with nyc (18.0.0) for code coverage
- nock remains at 8.0.0 for compatibility with the `request` library

#### Production Dependencies
- Updated js-cookie from 2.2.0 to 3.0.5
- Updated request from 2.78.0 to 2.88.2 (final version before deprecation)

### Security
- **Fixed 51 security vulnerabilities** (reduced from 59 to 8)
- Eliminated all critical babel-traverse vulnerabilities by migrating to nyc
- Updated multiple dependencies to address high and moderate severity issues

### Breaking Changes
- **Node.js 14+ required** - Dropped Node.js 12 support due to updated dependencies (mocha 11, jsdom 29)
- **Webpack 5** - If you use custom webpack configuration, review the [webpack 5 migration guide](https://webpack.js.org/migrate/5/)

### Known Issues

#### Remaining Vulnerabilities (8 total)
The following vulnerabilities remain and are documented for transparency:

**Dev Dependencies (3 vulnerabilities - not shipped to users):**
- `diff` (1 low): DoS vulnerability in parsePatch - dev-only, minimal risk
- `serialize-javascript` (2 high): RCE and DoS vulnerabilities - transitive dependency of mocha, dev-only

**Production Dependencies (5 vulnerabilities - shipped with SDK):**
These are all in the deprecated `request` library and its dependencies:
- `form-data` (1 critical): Unsafe random function for boundaries - low actual risk for API calls
- `qs` (1 moderate): DoS via memory exhaustion - low risk with controlled inputs
- `tough-cookie` (1 moderate): Prototype pollution - low risk with trusted cookie sources
- `request` (2 vulnerabilities via transitive deps): No fix available as library is deprecated

**Note on `request` library:**
The `request` library was deprecated in 2020 and is no longer maintained. Version 2.88.2 is the final release and contains known vulnerabilities with no available fixes. We've updated to the latest version to minimize risk, but a future migration to a modern HTTP library (axios, node-fetch, or native fetch) is recommended. This is documented as a separate engineering story.

### Compatibility
- Requires Node.js 14.0.0 or higher
- Supports Node.js 14, 16, 18, 20+
- All existing SDK APIs remain unchanged and backward compatible

### Migration Guide

#### For SDK Users
No code changes required. Simply update your package.json:
```bash
npm install fs-js-lite@latest
```

Ensure you're running Node.js 14 or higher:
```bash
node --version  # Should be v14.0.0 or higher
```

#### For Contributors
If you're developing or testing this SDK:

1. Ensure Node.js 14+ is installed
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run coverage: `npm run coverage` (now uses nyc instead of istanbul)

### Testing
- ✅ All 26 tests passing (19 Node.js + 7 browser tests)
- ✅ 87.76% code coverage
- ✅ Build succeeds with webpack 5
- ✅ Browser bundle correctly generated

---

## [2.6.6] - Previous Release
(Previous changelog entries would go here)
