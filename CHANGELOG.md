# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
