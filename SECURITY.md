# Security Policy

## Secure Cookie Defaults (v3.0.0+)

Starting with version 3.0.0, fs-js-lite sets secure cookie defaults to protect against common web vulnerabilities:

### Default Security Settings

- **`secure: true`** - Cookies are only sent over HTTPS connections
- **`sameSite: 'strict'`** - Cookies are not sent with cross-site requests (CSRF protection)
- **`path: '/'`** - Cookies are available across your entire domain

### Why These Defaults Matter

**Secure Flag (HTTPS Only)**
- Prevents cookies from being sent over unencrypted HTTP connections
- Protects access tokens from network eavesdropping
- **Required in production** - only disable for local development over HTTP

**SameSite Attribute (CSRF Protection)**
- `strict` - Cookie never sent with cross-site requests (most secure)
- `lax` - Cookie sent with top-level navigation from external sites
- `none` - Cookie sent with all cross-site requests (requires `secure: true`)

**Path Attribute**
- `/` - Cookie available to your entire application
- More specific paths can restrict cookie scope if needed

### Configuration for Different Environments

**Production (HTTPS) - Use Defaults**
```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true
  // secure: true, sameSite: 'strict', path: '/' are defaults
});
```

**Local Development (HTTP)**
```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  secureCookies: false  // Allow cookies over HTTP for localhost
});
```

**Custom SameSite for Cross-Site Authentication**
```javascript
var client = new FamilySearch({
  appKey: 'your-app-key',
  saveAccessToken: true,
  sameSite: 'lax'  // Allow top-level navigation from external sites
});
```

### Security Best Practices

1. **Always use HTTPS in production** - Never set `secureCookies: false` in production
2. **Use `strict` sameSite when possible** - Provides strongest CSRF protection
3. **Keep tokens short-lived** - Tokens automatically expire after 24 hours maximum
4. **Use PKCE for OAuth** - Strongly recommended in v3.0.0+, provides protection against authorization code interception
5. **Don't store tokens in localStorage** - Use cookies with httpOnly when possible (requires server-side implementation)

### What's NOT Protected

**Client-Side Cookie Limitations:**
- This SDK runs in the browser and cannot set `httpOnly` cookies
- `httpOnly` cookies can only be set by servers via HTTP headers
- Cookies set by this SDK are accessible to JavaScript (XSS risk if your site has XSS vulnerabilities)
- **Recommendation:** For maximum security, have your server set httpOnly cookies after OAuth callback

### Reporting Security Issues

If you discover a security vulnerability in fs-js-lite, please report it to:

**Email:** security@familysearch.org

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

**Please do not** open public GitHub issues for security vulnerabilities.

### Security Updates

- **v3.0.0** - Added secure cookie defaults (secure, sameSite, path)
- **v3.0.0** - PKCE strongly recommended for OAuth flows (optional for backward compatibility)
- **v2.7.0** - Added PKCE support for OAuth 2.1 compliance

### Additional Resources

- [OWASP Cookie Security Guide](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OAuth 2.1 Security Best Practices](https://oauth.net/2.1/)
- [PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
