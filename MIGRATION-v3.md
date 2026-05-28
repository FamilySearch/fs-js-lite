# Migration Guide: v2.x to v3.0.0

## Breaking Changes

Version 3.0.0 introduces secure cookie defaults that may affect your application. This guide helps you migrate smoothly.

---

## 1. Secure Cookies Now Default to True

### What Changed

**v2.x Behavior:**
```javascript
// Cookies had no security flags
cookies.set('FS_AUTH_TOKEN', token, { 
  expires: 1, 
  path: undefined  // defaulted to current path
});
```

**v3.0.0 Behavior:**
```javascript
// Cookies now have security flags by default
cookies.set('FS_AUTH_TOKEN', token, {
  expires: 1,
  path: '/',           // NEW: defaults to '/'
  secure: true,        // NEW: HTTPS only
  sameSite: 'strict'   // NEW: CSRF protection
});
```

### Migration Required?

**✅ Your app uses HTTPS** → No changes needed, you get better security for free!

**⚠️ Your app uses HTTP (local dev only)** → You need to disable secure cookies:

```javascript
// v3.0.0 - Disable secure cookies for local HTTP development
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false  // Required for http://localhost
});
```

---

## 2. Cookie Path Now Defaults to '/'

### What Changed

**v2.x:** `tokenCookiePath` defaulted to `undefined` (used current path)  
**v3.0.0:** `tokenCookiePath` defaults to `'/'` (available to entire domain)

### Impact

**Most apps:** This is an improvement - tokens are now available across your entire application.

**If you need the old behavior:**
```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  tokenCookiePath: window.location.pathname  // Restore v2.x behavior
});
```

---

## 3. New Configuration Options

### secureCookies

Control whether cookies require HTTPS.

```javascript
// Production (default)
secureCookies: true   // Cookies only sent over HTTPS

// Local development
secureCookies: false  // Allow HTTP (use only in development!)
```

### sameSite

Control CSRF protection level.

```javascript
// Default (most secure)
sameSite: 'strict'  // Never send cookies cross-site

// More permissive
sameSite: 'lax'     // Send cookies with top-level navigation

// Least secure
sameSite: 'none'    // Send cookies with all requests (requires secure: true)
```

---

## Common Migration Scenarios

### Scenario 1: Production App on HTTPS

**No changes needed!** 🎉

Your app automatically benefits from improved security.

```javascript
// v2.x code
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true
});

// Still works in v3.0.0! Now with secure defaults.
```

### Scenario 2: Local Development on HTTP

**Add `secureCookies: false`**

```javascript
// v3.0.0 - Add this for local development
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false  // NEW: Required for http://localhost
});
```

**Best Practice:** Use environment detection:

```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: window.location.protocol === 'https:'  // Auto-detect
});
```

### Scenario 3: Mixed HTTP/HTTPS Environments

**Use environment-specific configuration**

```javascript
var isProduction = window.location.hostname !== 'localhost';

var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: isProduction,
  sameSite: isProduction ? 'strict' : 'lax'
});
```

### Scenario 4: Cross-Site Authentication Flow

If your OAuth callback is on a different domain:

```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  sameSite: 'lax'  // Allow top-level cross-site navigation
});
```

---

## Testing Your Migration

### 1. Check Your Protocol

```javascript
console.log('Protocol:', window.location.protocol);
// https: → No changes needed
// http:  → Add secureCookies: false (dev only!)
```

### 2. Verify Cookies Are Set

```javascript
var client = new FamilySearch({ 
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false  // If testing on HTTP
});

client.setAccessToken('test-token');

// Check browser DevTools > Application > Cookies
// Should see: FS_AUTH_TOKEN=test-token
```

### 3. Test Cookie Security Flags

In browser DevTools > Application > Cookies, verify:

**Production (HTTPS):**
- ✅ Secure: Yes
- ✅ SameSite: Strict
- ✅ Path: /

**Development (HTTP):**
- ⚠️ Secure: No (because secureCookies: false)
- ✅ SameSite: Strict (or Lax if you customized)
- ✅ Path: /

---

## Troubleshooting

### Problem: Cookies not being set

**Symptoms:** `client.setAccessToken()` doesn't create a cookie

**Cause:** Using HTTP with `secureCookies: true` (default)

**Fix:**
```javascript
// Add this for local development
secureCookies: false
```

### Problem: Cookies not persisting across pages

**Cause:** Path was too specific in v2.x

**Fix:** v3.0.0 defaults to `path: '/'` which fixes this! No action needed.

### Problem: Cross-site cookies not working

**Cause:** `sameSite: 'strict'` prevents cross-site requests

**Fix:**
```javascript
sameSite: 'lax'  // or 'none' (requires secure: true)
```

---

## Rollback Plan

If you need to temporarily revert to v2.x behavior:

```javascript
// Emulate v2.x behavior in v3.0.0
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  tokenCookiePath: window.location.pathname,  // v2.x default
  secureCookies: false,                       // v2.x had no secure flag
  sameSite: 'lax'                             // v2.x had no sameSite (note: 'none' requires secure: true)
});
```

**⚠️ Not recommended for production** - this removes security protections!

---

## Questions?

- **Security concerns?** See [SECURITY.md](./SECURITY.md)
- **Bug reports?** [Open an issue](https://github.com/FamilySearch/fs-js-lite/issues)
- **General questions?** Check the [README](./README.md)

---

## Summary Checklist

- [ ] Are you using HTTPS in production? (No changes needed!)
- [ ] Are you using HTTP in development? (Add `secureCookies: false`)
- [ ] Do you need cross-site cookies? (Set `sameSite: 'lax'` or `'none'`)
- [ ] Have you tested in your environment?
- [ ] Are cookies showing up in DevTools > Application > Cookies?

**Most apps need zero changes** if running on HTTPS! 🎉
