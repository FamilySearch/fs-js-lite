var cookies = require('js-cookie'),
    Request = require('./Request'),
    requestHandler = require('./nodeHandler'),
    utils = require('./utils'),
    requestMiddleware = require('./middleware/request'),
    responseMiddleware = require('./middleware/response'),
    pkce = require('./pkce');

/**
 * Create an instance of the FamilySearch SDK Client
 * 
 * @param {Object} options See a description of the possible options in the docs for config().
 */
var FamilySearch = function(options){
  
  // Set the default options
  this.appKey = '';
  this.environment = 'integration';
  this.redirectUri = '';
  this.tokenCookie = 'FS_AUTH_TOKEN';
  this.maxThrottledRetries = 10;
  this.saveAccessToken = false;
  this.accessToken = '';
  this.jwt = '';
  this.middleware = {
    request: [
      requestMiddleware.url,
      requestMiddleware.defaultAcceptHeader,
      requestMiddleware.authorizationHeader, 
      requestMiddleware.disableAutomaticRedirects, 
      requestMiddleware.body
    ],
    response: [
      responseMiddleware.redirect, 
      responseMiddleware.throttling, 
      responseMiddleware.json
    ]
  };
  
  // Process options
  this.config(options);
};

/**
 * Set the configuration options of the SDK client.
 * 
 * @param {Object} options
 * @param {String} options.environment Reference environment: production, beta,
 * or integration. Defaults to integration.
 * @param {String} options.appKey Application Key
 * @param {String} options.redirectUri OAuth2 redirect URI
 * @param {String} options.saveAccessToken Save the access token to a cookie
 * and automatically load it from that cookie. Defaults to false.
 * @param {String} options.accessToken Initialize the client with an access token.
 * @param {String} options.tokenCookie Name of the cookie that the access token
 * will be saved in when `saveAccessToken` is true. Defaults to 'FS_AUTH_TOKEN'.
 * @param {String} options.tokenCookiePath Path value of the access token cookie.
 * Defaults to current path (which is probably not what you want).
 * @param {String} options.maxThrottledRetries Maximum number of a times a 
 * throttled request should be retried. Defaults to 10.
 * @param {Array} options.pendingModifications List of pending modifications
 * that should be activated.
 * @param {Integer} options.requestInterval Minimum interval between requests in milliseconds (ms).
 * By default this behavior is disabled; i.e. requests are issued immediately.
 * When this option is set then requests are queued to ensure there is at least
 * {requestInterval} ms between them. This is useful for smoothing out bursts
 * of requests and thus playing nice with the API servers.
 */
FamilySearch.prototype.config = function(options){
  this.appKey = options.appKey || this.appKey;
  this.environment = options.environment || this.environment;
  this.redirectUri = options.redirectUri || this.redirectUri;
  this.tokenCookie = options.tokenCookie || this.tokenCookie;
  this.tokenCookiePath = options.tokenCookiePath || this.tokenCookiePath;
  this.maxThrottledRetries = options.maxThrottledRetries || this.maxThrottledRetries;
  this.saveAccessToken = (options.saveAccessToken === true) || this.saveAccessToken;
  
  if(options.accessToken){
    this.setAccessToken(options.accessToken);
  }
  
  if(Array.isArray(options.pendingModifications) && options.pendingModifications.length > 0){
    this.addRequestMiddleware(requestMiddleware.pendingModifications(options.pendingModifications));
  }
  
  if(parseInt(options.requestInterval, 10)) {
    this.addRequestMiddleware(requestMiddleware.requestInterval(parseInt(options.requestInterval, 10)));
  }
  
  // When the SDK is configured to save the access token in a cookie and we don't
  // presently have an access token then we try loading one from the cookie.
  //
  // We only do this when the saveAccessToken value changes, thus we examine
  // the value from the options object instead of the SDK. But the accessToken
  // has already been processed above so we check the SDK to see whether or not
  // an access token is already available.
  if(options.saveAccessToken && !this.getAccessToken()) {
    var token = cookies.get(this.tokenCookie);
    if(token){
      this.setAccessToken(token);
    }
  }
};

/**
 * Start the OAuth2 redirect flow by redirecting the user to FamilySearch.org
 * 
 * @param {String} state
 */
FamilySearch.prototype.oauthRedirect = function(state){
  window.location.href = this.oauthRedirectURL(state);
};

/**
 * Generate the OAuth 2 redirect URL with PKCE support
 *
 * OAuth 2.1 requires PKCE (Proof Key for Code Exchange) for security.
 * You must provide a code_challenge parameter for modern OAuth flows.
 *
 * @param {String|Object} options - Either a state string (legacy) or options object
 * @param {String} options.state - CSRF protection token (recommended)
 * @param {String} options.codeChallenge - PKCE code challenge (REQUIRED for OAuth 2.1)
 * @param {String} options.scope - OAuth scopes (optional, defaults to standard scopes)
 * @return {String} The authorization URL to redirect the user to
 *
 * @example
 * // Modern usage with PKCE (RECOMMENDED)
 * var verifier = client.generateCodeVerifier();
 * var challenge = client.generateCodeChallenge(verifier);
 * sessionStorage.setItem('pkce_verifier', verifier); // Save for later
 * var url = client.oauthRedirectURL({
 *   codeChallenge: challenge,
 *   state: 'random-csrf-token'
 * });
 *
 * @example
 * // Legacy usage (deprecated, for backward compatibility)
 * var url = client.oauthRedirectURL('csrf-token');
 */
FamilySearch.prototype.oauthRedirectURL = function(options){
  // Backward compatibility: if options is a string, treat it as the state parameter
  var state, codeChallenge, scope;
  if(typeof options === 'string'){
    state = options;
    codeChallenge = null;
    scope = 'openid profile email qualifies_for_affiliate_account country';
  } else if(typeof options === 'object' && options !== null){
    state = options.state;
    codeChallenge = options.codeChallenge;
    scope = options.scope || 'openid profile email qualifies_for_affiliate_account country';
  } else {
    // No options provided
    state = null;
    codeChallenge = null;
    scope = 'openid profile email qualifies_for_affiliate_account country';
  }

  // Build the authorization URL
  var url = this.identHost() + '/cis-web/oauth2/v3/authorization?response_type=code&scope=' + encodeURIComponent(scope)
    + '&client_id=' + encodeURIComponent(this.appKey)
    + '&redirect_uri=' + encodeURIComponent(this.redirectUri);

  // Add PKCE parameters if provided (OAuth 2.1 requirement)
  if(codeChallenge){
    url += '&code_challenge=' + encodeURIComponent(codeChallenge);
    url += '&code_challenge_method=S256'; // SHA256 hashing
  }

  // Add state parameter if provided (CSRF protection)
  if(state){
    url += '&state=' + encodeURIComponent(state);
  }

  return url;
};

/**
 * Handle an OAuth2 redirect response by extracting the code from the query
 * and exchanging it for an access token with PKCE support
 *
 * This is a convenience method for browser applications. It automatically:
 * 1. Extracts the authorization code from the URL query parameters
 * 2. Validates the state parameter (CSRF protection)
 * 3. Exchanges the code (+ verifier) for an access token
 * 4. Saves the token in a cookie if saveAccessToken is enabled
 *
 * @param {String|Object|Function} options - State string (legacy), options object, or callback
 * @param {String} options.state - Expected state value for CSRF validation
 * @param {String} options.codeVerifier - PKCE code verifier (REQUIRED for OAuth 2.1)
 * @param {Function} callback - Callback function(error, response)
 * @return {Boolean} true if a code was found and exchange was attempted
 *
 * @example
 * // Modern usage with PKCE (RECOMMENDED)
 * var verifier = sessionStorage.getItem('pkce_verifier');
 * var state = sessionStorage.getItem('oauth_state');
 * client.oauthResponse({
 *   state: state,
 *   codeVerifier: verifier
 * }, function(error, response) {
 *   if (!error) {
 *     console.log('Authenticated!');
 *   }
 * });
 *
 * @example
 * // Legacy usage (backward compatibility)
 * client.oauthResponse('state-token', function(error, response) { });
 */
FamilySearch.prototype.oauthResponse = function(options, callback){
  var state, codeVerifier, cb;

  // Handle different argument patterns for backward compatibility
  if(typeof options === 'function'){
    // oauthResponse(callback) - no state or verifier
    cb = options;
    state = undefined;
    codeVerifier = undefined;
  } else if(typeof options === 'string'){
    // oauthResponse(state, callback) - legacy with state string
    state = options;
    codeVerifier = undefined;
    cb = callback;
  } else if(typeof options === 'object' && options !== null){
    // oauthResponse({ state, codeVerifier }, callback) - modern with options
    state = options.state;
    codeVerifier = options.codeVerifier;
    cb = callback;
  } else {
    // oauthResponse(null/undefined, callback)
    state = undefined;
    codeVerifier = undefined;
    cb = callback;
  }

  // Validate state parameter if provided (CSRF protection)
  var stateQuery = utils.getParameterByName('state');
  if(state && state !== stateQuery){
    return false;
  }

  // Extract the authorization code from the URL query parameters
  var code = utils.getParameterByName('code');
  if(code){
    // Exchange the code (+ verifier) for an access token
    if(codeVerifier){
      this.oauthToken(code, codeVerifier, cb);
    } else {
      this.oauthToken(code, cb);
    }
    return true;
  }

  // No code found in query parameters
  return false;
};

/**
 * Exchange an OAuth authorization code for an access token
 *
 * With PKCE (OAuth 2.1), you must provide the code_verifier that you generated
 * earlier. This proves you're the same client that initiated the authorization.
 *
 * @param {String} code - The authorization code from the OAuth redirect
 * @param {String|Function} codeVerifier - PKCE code verifier, or callback (legacy)
 * @param {Function} callback - Callback function(error, response)
 *
 * @example
 * // Modern usage with PKCE (RECOMMENDED)
 * var verifier = sessionStorage.getItem('pkce_verifier');
 * client.oauthToken(code, verifier, function(error, response) {
 *   if (!error) {
 *     console.log('Access token:', response.data.access_token);
 *   }
 * });
 *
 * @example
 * // Legacy usage without PKCE (deprecated, for backward compatibility)
 * client.oauthToken(code, function(error, response) {
 *   // ...
 * });
 */
FamilySearch.prototype.oauthToken = function(code, codeVerifier, callback){
  var client = this;

  // Backward compatibility: if codeVerifier is a function, it's actually the callback
  var verifier, cb;
  if(typeof codeVerifier === 'function'){
    // Old signature: oauthToken(code, callback)
    cb = codeVerifier;
    verifier = null;
  } else {
    // New signature: oauthToken(code, codeVerifier, callback)
    cb = callback;
    verifier = codeVerifier;
  }

  // Build the request body
  var body = {
    grant_type: 'authorization_code',
    code: code,
    client_id: client.appKey
  };

  // Add code_verifier for PKCE if provided
  if(verifier){
    body.code_verifier = verifier;
  }

  client.post(client.identHost() + '/cis-web/oauth2/v3/token?redirect_uri=' + this.redirectUri, {
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, function(error, response){
    // Save the OpenId Connect JWT
    if(response && response.data){
      client.jwt = response.data.id_token;
    }
    client.processOauthResponse(error, response, cb);
  });
};

/**
 * Obtain an access token for an unauthenticated session. Currently unauthenticated
 * access tokens only grant access to the Dates and Places endpoints.
 * 
 * @param {String} ipAddress The IP address of the user
 * @param {Function} callback that receives the access token response
 */
FamilySearch.prototype.oauthUnauthenticatedToken = function(ipAddress, callback){
  var client = this;
  client.post(client.identHost() + '/cis-web/oauth2/v3/token', {
    body: {
      grant_type: 'unauthenticated_session',
      ip_address: ipAddress,
      client_id: client.appKey
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, function(error, response){
    client.processOauthResponse(error, response, callback);
  });
};

/**
 * Process an OAuth2 access_token response
 */
FamilySearch.prototype.processOauthResponse = function(error, response, callback){
  if(response && response.statusCode === 200 && response.data){
    this.setAccessToken(response.data.access_token);
  }
  if(callback){
    setTimeout(function(){
      callback(error, response);
    });
  }
};

/**
 * Set the access token. The token is also saved to a cookie if that behavior
 * is enabled.
 * 
 * @param {String} accessToken
 * @return {FamilySearch} client
 */
FamilySearch.prototype.setAccessToken = function(accessToken){
  this.accessToken = accessToken;
  if(this.saveAccessToken){
    // Expire in 24 hours because tokens never last longer than that, though
    // they can expire before that after 1 hour of inactivity.
    cookies.set(this.tokenCookie, accessToken, { expires: 1, path: this.tokenCookiePath });
  }
  return this;
};

/**
 * Get the access token if one is currently set
 * 
 * @return {String} access token
 */
FamilySearch.prototype.getAccessToken = function(){
  return this.accessToken;
};

/**
 * Delete the access token
 *
 * @return {FamilySearch} client
 */
FamilySearch.prototype.deleteAccessToken = function(){
  this.accessToken = undefined;
  if(this.saveAccessToken){
    cookies.remove(this.tokenCookie, { path: this.tokenCookiePath });
  }
  return this;
};

/**
 * Generate a cryptographically random PKCE code verifier
 *
 * PKCE (Proof Key for Code Exchange) is required for OAuth 2.1. The code verifier
 * is a secret random string that you generate and store securely on the client.
 * You'll need this later to exchange the authorization code for an access token.
 *
 * Usage:
 *   var verifier = client.generateCodeVerifier();
 *   // Store verifier in sessionStorage (NEVER localStorage - security risk)
 *   sessionStorage.setItem('pkce_verifier', verifier);
 *
 * @return {String} A cryptographically random 43-character code verifier
 */
FamilySearch.prototype.generateCodeVerifier = function(){
  return pkce.generateCodeVerifier();
};

/**
 * Generate a PKCE code challenge from a code verifier
 *
 * The code challenge is a SHA256 hash of the code verifier. You send this
 * (not the verifier itself!) to FamilySearch in the authorization URL.
 * Later, when you exchange the authorization code for a token, you send
 * the original verifier, and FamilySearch verifies it matches the challenge.
 *
 * Usage:
 *   var verifier = client.generateCodeVerifier();
 *   var challenge = client.generateCodeChallenge(verifier);
 *   // Use challenge in oauthRedirectURL()
 *
 * @param {String} verifier The code verifier string
 * @return {String} The base64url-encoded SHA256 hash of the verifier
 */
FamilySearch.prototype.generateCodeChallenge = function(verifier){
  return pkce.generateCodeChallenge(verifier);
};

/**
 * Add request middleware
 * 
 * @param {Function} middleware
 * @return {FamilySearch} client
 */
FamilySearch.prototype.addRequestMiddleware = function(middleware){
  this.middleware.request.push(middleware);
  return this;
};

/**
 * Add response middleware
 * 
 * @param {Function} middleware
 * @return {FamilySearch} client
 */
FamilySearch.prototype.addResponseMiddleware = function(middleware){
  this.middleware.response.push(middleware);
  return this;
};

/**
 * Execute an HTTP GET
 * 
 * @param {String} url
 * @param {Object=} options See request() for an explanation of the options
 * @param {Function} callback
 */
FamilySearch.prototype.get = _req('GET');

/**
 * Execute an HTTP POST
 * 
 * @param {String} url
 * @param {Object=} options See request() for an explanation of the options
 * @param {Function} callback
 */
FamilySearch.prototype.post = _req('POST');

/**
 * Execute an HTTP HEAD
 * 
 * @param {String} url
 * @param {Object=} options See request() for an explanation of the options
 * @param {Function} callback
 */
FamilySearch.prototype.head = _req('HEAD');

/**
 * Execute an HTTP DELETE
 * 
 * @param {String} url
 * @param {Object=} options See request() for an explanation of the options
 * @param {Function} callback
 */
FamilySearch.prototype.delete = _req('DELETE');

/**
 * Construct a request wrapper for the specified HTTP method
 */
function _req(method){
  
  /**
   * @param {String} url
   * @param {Object=} options See request() for an explanation of the options
   * @param {Function} callback
   */
  return function(url, options, callback){
  
    // Allow for options to not be given in which case the callback will be
    // the second argument
    if(typeof options === 'function'){
      callback = options;
      options = {};
    }
    
    options.method = method;
    
    this.request(url, options, callback);
  };
}

/**
 * Execute an HTTP request
 * 
 * @param {String} url
 * @param {Object=} options
 * @param {String} options.method HTTP method. Defaults to GET
 * @param {Object} options.headers HTTP headers. `{'Content-Type':'application/x-fs-v1+json'}`
 * @param {String|Object} options.body Request body. May be a JavaScript object
 * or a string. If an object is detected then the SDK will attempt automatically
 * set the `Content-Type` header to `application/x-fs-v1+json` if it's missing.
 * @param {Function} callback
 */
FamilySearch.prototype.request = function(url, options, callback){
  
  // Allow for options to not be given in which case the callback will be
  // the second argument
  if(typeof options === 'function'){
    callback = options;
    options = {};
  }
  
  this._execute(new Request(url, options, callback), callback);
};

/**
 * Execute a request
 *
 * @param {Object} request
 * @param {Function} callback - Callback function(error, response)
 */
FamilySearch.prototype._execute = function(request, callback){
  var client = this;
  
  // First we run request middleware
  client._runRequestMiddleware(request, function(error, middlewareResponse){
    
    // Return the error if one was received from the middleware
    if(error || middlewareResponse){
      responseHandler(error, middlewareResponse);
    } 
    
    // If we didn't receive a response from the request middleware then we
    // proceed with executing the actual request.
    else {
      requestHandler(request, responseHandler);
    }
  });
  
  function responseHandler(error, response){
    // If the request errored then we immediately return and don't run
    // response middleware because we don't have an HTTP response
    if(error){
      setTimeout(function(){
        callback(error);
      });
    }
    
    // Run response middleware
    else {
      client._runResponseMiddleware(request, response, function(error){
        setTimeout(function(){
          if(error){
            callback(error);
          } else {
            callback(undefined, response);
          }
        });
      });
    }
  }
};

/**
 * Run request middleware
 *
 * @param {Object} request
 * @param {Function} callback - Callback function(error, response)
 */
FamilySearch.prototype._runRequestMiddleware = function(request, callback){
  var client = this;
  utils.asyncEach(this.middleware.request, function(middleware, next){
    middleware(client, request, function(error, newResponse){
      if(error || newResponse){
        callback(error, newResponse);
      } else {
        next();
      }
    });
  }, callback);
};

/**
 * Run response middleware
 *
 * @param {Object} request
 * @param {Object} response
 * @param {Function} callback - Callback function(error)
 */
FamilySearch.prototype._runResponseMiddleware = function(request, response, callback){
  var client = this;
  utils.asyncEach(this.middleware.response, function(middleware, next){
    middleware(client, request, response, function(error, cancel){
      if(error){
        callback(error);
      } else if(typeof cancel === 'undefined') {
        next();
      }
    });
  }, callback);
};

/**
 * Get the ident host name for OAuth
 *
 * Returns the appropriate OAuth/Identity server URL based on the environment.
 * Note: Integration environment now uses identint.familysearch.org (updated 2026).
 *
 * @return {String} The OAuth server base URL
 */
FamilySearch.prototype.identHost = function(){
  switch (this.environment) {
    case 'production':
      return 'https://ident.familysearch.org';
    case 'beta':
      return 'https://identbeta.familysearch.org';
    default:
      // Integration/sandbox environment
      return 'https://identint.familysearch.org';
  }
};

/**
 * Get the host name for the platform API
 * 
 * @return string
 */
FamilySearch.prototype.platformHost = function(){
  switch (this.environment) {
    case 'production':
      return 'https://api.familysearch.org';
    case 'beta':
      return 'https://beta.familysearch.org';
    default:
      return 'https://api-integ.familysearch.org';
  }
};

module.exports = FamilySearch;
