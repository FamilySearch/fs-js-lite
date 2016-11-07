var cookies = require('doc-cookies'),
    Request = require('./Request'),
    XHR = require('./XHR'),
    utils = require('./utils');

/**
 * Create an instance of the FamilySearch SDK Client
 * 
 * @param {Object} options
 * @param {String} options.environment Reference environment: production, beta,
 * or integration. Defaults to integration.
 * @param {String} options.appKey Application Key
 * @param {String} options.redirectUri OAuth2 redirect URI
 * @param {String} options.saveAccessToken Save the access token to a cookie
 * and automatically load it from that cookie. Defaults to true.
 * @param {String} options.tokenCookie Name of the cookie that the access token
 * will be saved in. Defaults to 'FS_AUTH_TOKEN'.
 * @param {String} options.maxThrottledRetries Maximum number of a times a 
 * throttled request should be retried. Defaults to 10.
 */
var FamilySearch = function(options){
  this.appKey = options.appKey;
  this.environment = options.environment || 'integration';
  this.redirectUri = options.redirectUri;
  this.saveAccessToken = options.saveAccessToken || true;
  this.tokenCookie = options.tokenCookie || 'FS_AUTH_TOKEN';
  this.maxThrottledRetries = options.maxThrottledRetries || 10;
  
  // Figure out initial authentication state
  if(this.saveAccessToken){
    
    // If an access token was provided, save it.
    if(options.accessToken){
      this.setAccessToken(options.accessToken);
    }
    
    // If we don't have an access token, try loading one.
    else {
      var token = cookies.getItem(this.tokenCookie);
      if(token){
        this.accessToken = token;
      }
    }
  }
};

/**
 * Start the OAuth2 redirect flow by redirecting the user to FamilySearch.org
 */
FamilySearch.prototype.oauthRedirect = function(){
  window.location.href = this.identHost() + '/cis-web/oauth2/v3/authorization' +
    '?response_type=code&client_id=' + this.appKey + '&redirect_uri=' + this.redirectUri;
};

/**
 * Handle an OAuth2 redirect response by extracting the code from the query
 * and exchanging it for an access token. This also automatically saves the
 * token in a cookie when that behavior is enabled.
 * 
 * @param {Function} callback that receives the access token response
 * @return {Boolean} true if a code was detected; false otherwise. This does
 * not indicate whether an access token was successfully requested, just
 * whether a code was found in the query param and a request was sent to
 * exchange the code for a token.
 */
FamilySearch.prototype.oauthResponse = function(callback){
  
  var client = this;
  
  // Extract the code from the query
  var code = utils.getParameterByName('code');
  
  if(code){
  
    // Exchange the code for the access token
    this.post(this.identHost() + '/cis-web/oauth2/v3/token', {
      body: {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.appKey
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, function(response){
      client.processOauthResponse(response, callback);
    });
    
    return true;
    
  }
  
  return false;
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
  }, function(response){
    client.processOauthResponse(response, callback);
  });
};

/**
 * Process an OAuth2 access_token response
 */
FamilySearch.prototype.processOauthResponse = function(response, callback){
  if(response && response.statusCode === 200 && response.data){
    this.setAccessToken(response.data.access_token);
  }
  if(callback){
    setTimeout(function(){
      callback(response);
    });
  }
};

/**
 * Set the access token. The token is also saved to a cookie if that behavior
 * is enabled.
 * 
 * @param {String} accessToken
 */
FamilySearch.prototype.setAccessToken = function(accessToken){
  this.accessToken = accessToken;
  if(this.saveAccessToken){
    // Expire in 24 hours because tokens never last longer than that, though
    // they can expire before that after 1 hour of inactivity.
    cookies.setItem(this.tokenCookie, accessToken, 86400);
  }
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
 */
FamilySearch.prototype.deleteAccessToken = function(){
  this.accessToken = undefined;
  if(this.saveAccessToken){
    cookies.removeItem(this.tokenCookie);
  }
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
  
  var client = this,
      request;
  
  // Allow for options to not be given in which case the callback will be
  // the second argument
  if(typeof options === 'function'){
    callback = options;
    options = {};
  }
  
  if(!callback){
    callback = function(){};
  }
  
  request = new Request(url, options);
  request.prepare(this);
  
  XHR(request, function(response){
    client._processResponse(request, response, callback);
  });
  
};

/**
 * Handle redirects, throttling, and JSON parsing
 * 
 * @param {Object} request
 * @param {Object} response
 * @param {Function} callback(response)
 * 
 * @return {Function}
 */
FamilySearch.prototype._processResponse = function(request, response, callback){
    
  var client = this;
    
  // Catch redirects
  var location = response.getHeader('Location');
  if(response.statusCode === 200 && location && location !== request.url ){
    setTimeout(function(){
      client.request(response.getHeader('Location'), request, function(response){
        if(response){
          response.originalUrl = request.url;
          response.redirected = true;
        }
        setTimeout(function(){
          callback(response);
        });
      });
    });
    return;
  }
  
  if(response.statusCode === 429 && request.retries < client.maxThrottledRetries){
    var retryAfter = parseInt(response.getHeader('Retry'), 10) * 1000 || 1000;
    setTimeout(function(){
      client.request(request.url, request, function(response){
        response.throttled = true;
        response.retries = ++request.retries;
        setTimeout(function(){
          callback(response);
        });
      });
    }, retryAfter);
    return;
  }
  
  var contentType = response.getHeader('Content-Type');
  if(contentType && contentType.indexOf('json') !== -1){
    try {
      response.data = JSON.parse(response.body);
    } catch(e) { 
      // Should we handle this error? how could we?
    }
  }
  
  callback(response);
    
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
      return 'https://integration.familysearch.org';
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
      return 'https://familysearch.org';
    case 'beta':
      return 'https://beta.familysearch.org';
    default:
      return 'https://integration.familysearch.org';
  }
};

module.exports = FamilySearch;