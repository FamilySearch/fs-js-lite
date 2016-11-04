var cookies = require('doc-cookies');

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
  var code = getParameterByName('code');
  
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
FamilySearch.prototype.request = function(originalUrl, originalOptions, callback){
  
  var client = this,
      finalOptions;
  
  // Allow for options to not be given in which case the callback will be
  // the second argument
  if(typeof options === 'function'){
    callback = originalOptions;
    originalOptions = {};
  }
  
  if(!callback){
    callback = function(){};
  }
  
  finalOptions = this._prepareRequestOptions(originalUrl, originalOptions);
  
  // Create the XMLHttpRequest
  var req = new XMLHttpRequest();
  req.open(finalOptions.method, finalOptions.url);
  
  // Set headers
  for(var name in finalOptions.headers){
    if(finalOptions.headers.hasOwnProperty(name)) {
      req.setRequestHeader(name, finalOptions.headers[name]);
    }
  }
  
  // Attach response handler
  req.onload = function(){
    client._processResponse(req, finalOptions, callback);
  };
  
  // Attach error handler
  req.onerror = function(error){
    callback();
  };
  
  // Now we can send the request
  req.send(finalOptions.body);
  
};

/**
 * Process request options to set defaults and prepare for creating the
 * XMLHttpRequest
 */
FamilySearch.prototype._prepareRequestOptions = function(url, originalOptions){
  
  var method = 'GET',
      headers = {},
      body,
      retries = 0;
      
  if(originalOptions.retries){
    retries = originalOptions.retries;
  }
  
  if(originalOptions.method){
    method = originalOptions.method;
  }
  
  if(originalOptions.headers){
    // Copy the headers
    headers = JSON.parse(JSON.stringify(originalOptions.headers));
  }
  
  body = originalOptions.body;
  
  // Calculate the URL
  //
  // For now we just need to know whether the protocol + host were provided
  // because if we just received a path such as /platform/tree/persons then
  // we want to automatically prepend the platform host.
  if(url.indexOf('https://') === -1){
    url = this.platformHost() + url;
  }
  
  var platformRequest = url.indexOf('/platform/') !== -1;
  
  // Set the Accept header if it's missing on /platform URLs
  if(!headers['Accept'] && platformRequest){
    headers['Accept'] = 'application/x-fs-v1+json';
  }
  
  // Set the Authorization header if we have an access token
  if(!headers['Authorization'] && this.accessToken){
    headers['Authorization'] = 'Bearer ' + this.accessToken;
  }
  
  // Disable automatic redirects
  if(!headers['X-Expect-Override'] && platformRequest){
    headers['X-Expect-Override'] = '200-ok';
  }
  
  // Process the body
  //
  // Allow for a string or object. If an object is given then stringify it.
  // Try to guess the appropriate `Content-Type` value if it's missing.
  if(body && (method === 'POST' || method === 'PUT')){
    
    // Try to guess the content type if it's missing
    if(!headers['Content-Type'] && platformRequest){
      headers['Content-Type'] = 'application/x-fs-v1+json';
    }
    
    // Turn objects into strings
    if(typeof body !== 'string'){
      
      // JSON.stringify() if the content-type is JSON
      if(headers['Content-Type'] && headers['Content-Type'].indexOf('json') !== -1){
        body = JSON.stringify(body);
      } 
      
      // URL encode
      else {
        body = urlEncode(body);
      }
      
    }
  }
  
  return {
    url: url,
    method: method,
    headers: headers,
    body: body,
    retries: retries
  };
};

/**
 * Handle a response
 * 
 * @param {XMLHttpRequest} req
 * @param {Object} options {url, method, headers, body, retries}
 * @param {Function} callback(res)
 * 
 * @return {Function}
 */
FamilySearch.prototype._processResponse = function(req, options, callback){
    
  var client = this;
    
  // Construct a response object
  var res = createResponse(req, options);
  
  // Catch redirects
  var location = res.getHeader('Location');
  if(res.statusCode === 200 && location && location !== options.url ){
    setTimeout(function(){
      client.request(res.getHeader('Location'), options, function(response){
        if(response){
          response.originalUrl = options.url;
          response.redirected = true;
        }
        setTimeout(function(){
          callback(response);
        });
      });
    });
    return;
  }
  
  if(res.statusCode === 429 && options.retries < client.maxThrottledRetries){
    var retryAfter = parseInt(res.getHeader('Retry'), 10) * 1000 || 1000;
    setTimeout(function(){
      client.request(options.url, options, function(response){
        response.throttled = true;
        response.retries = ++options.retries;
        setTimeout(function(){
          callback(response);
        });
      });
    }, retryAfter);
    return;
  }
  
  var contentType = res.getHeader('Content-Type');
  if(contentType && contentType.indexOf('json') !== -1){
    try {
      res.data = JSON.parse(res.body);
    } catch(e) { 
      // Should we handle this error? how could we?
    }
  }
  
  callback(res);
    
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

/**
 * Create a response object
 * 
 * @param {XMLHttpRequest} req
 * @param {Object} options {url, method, headers, body,  retries}
 * 
 * @return {Object} response
 */
function createResponse(req, options){
  return {
    statusCode: req.status,
    statusText: req.statusText,
    getHeader: function(name){
      return req.getResponseHeader(name);
    },
    getAllHeaders: function(){
      return req.getAllResponseHeaders();
    },
    originalUrl: options.url,
    effectiveUrl: options.url,
    redirected: false,
    requestMethod: options.method,
    requestHeaders: options.headers,
    body: req.responseText,
    retries: 0,
    throttled: false
  };
}

/**
 * URL encode an object
 * 
 * http://stackoverflow.com/a/1714899
 * 
 * @param {Object}
 * @return {String}
 */
function urlEncode(obj){
  var str = [];
  for(var p in obj){
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  }
  return str.join("&");
}

/**
 * Get a query parameter by name
 * 
 * http://stackoverflow.com/a/5158301
 */
function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

module.exports = FamilySearch;