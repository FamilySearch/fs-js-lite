var cookies = require('js-cookie'),
    Request = require('./Request'),
    requestHandler = require('./nodeHandler'),
    utils = require('./utils'),
    requestMiddleware = require('./middleware/request'),
    responseMiddleware = require('./middleware/response');

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
 * Generate the OAuth 2 redirect URL
 * 
 * @param {String} state
 */
FamilySearch.prototype.oauthRedirectURL = function(state){
  var url = this.identHost() + '/cis-web/oauth2/v3/authorization?response_type=code&scope=openid profile email qualifies_for_affiliate_account country' 
    + '&client_id=' + this.appKey + '&redirect_uri=' + this.redirectUri;
  if(state){
    url +=  '&state=' + state;
  }
  return url;
};

/**
 * Handle an OAuth2 redirect response by extracting the code from the query
 * and exchanging it for an access token. The token is automatically saved
 * in a cookie when that behavior is enabled.
 * 
 * @param {String=} state
 * @param {Function} callback that receives the access token response
 * @return {Boolean} true if a code was detected; false no code was found or if
 * a state param was given and it doesn't match the state param in the query. 
 * This does not indicate whether an access token was successfully requested, 
 * just whether a code was found in the query param and a request was sent to
 * exchange the code for a token.
 */
FamilySearch.prototype.oauthResponse = function(state, callback){
  
  // Allow the state parameter to be optional
  if(arguments.length === 1){
    callback = state;
    state = undefined;
  }
  
  // Compare state params
  var stateQuery = utils.getParameterByName('state');
  if(state && state !== stateQuery){
    return false;
  }
  
  // Extract the code from the query params
  var code = utils.getParameterByName('code');
  if(code){
  
    // Exchange the code for an access token
    this.oauthToken(code, callback);
    return true;
  }
  
  // Didn't have a code to exchange
  return false;
};

/**
 * Exchange an OAuth code for an access token. You don't need to call this in
 * the browser if you use oauthResponse() to automatically get the URL from the
 * query parameters.
 * 
 * @param {String} code
 * @param {Function} callback that receives the access token response
 */
FamilySearch.prototype.oauthToken = function(code, callback){
  var client = this;
  client.post(client.identHost() + '/cis-web/oauth2/v3/token', {
    body: {
      grant_type: 'authorization_code',
      code: code,
      client_id: client.appKey,
      redirectUri: this.redirectUri
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, function(error, response){
    // Save the OpenId Connect JWT
    client.jwt = response.data.id_token;
    client.processOauthResponse(error, response, callback);
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
 * OAuth2 password authentication
 * 
 * @param {String} username
 * @param {String} password
 * @param {Function} callback
 */
FamilySearch.prototype.oauthPassword = function(username, password, callback){
  var client = this;
  this.post(this.identHost() + '/cis-web/oauth2/v3/token', {
    body: {
      grant_type: 'password',
      client_id: this.appKey,
      username: username,
      password: password
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
 * @param {Function} callback(error, response)
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
 * @param {Function} callback(error)
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
 * @return string
 */
FamilySearch.prototype.identHost = function(){
  switch (this.environment) {
    case 'production':
      return 'https://ident.familysearch.org';
    case 'beta':
      return 'https://identbeta.familysearch.org';
    default:
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
