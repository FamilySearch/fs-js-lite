// UMD Wrapper
// https://github.com/umdjs/umd/blob/95563fd6b46f06bda0af143ff67292e7f6ede6b7/templates/commonjsStrict.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.FamilySearch = factory();
  }
}(this, function () {

  /**
   * Create an instance of the FamilySearch SDK Client
   * 
   * @param {Object} [options]
   * @param {String} [options.environment] Reference environment: production, beta,
   * or sandbox. Defaults to sandbox.
   * @param {String} [options.appKey] Application Key
   * @param {String} [options.redirectUri] OAuth2 redirect URI
   * @param {String} [options.saveAccessToken] Save the access token to a cookie
   * and automatically load it from that cookie. Defaults to true.
   * @param {String} [options.tokenCookie] Name of the cookie that the access token
   * will be saved in. Defaults to 'FS_AUTH_TOKEN'.
   * @param {String} [options.maxThrottledRetries] Maximum number of a times a 
   * throttled request should be retried. Defaults to 10.
   * @param {Object} [options.gedcomx] Reference to the gedcomx-js library used for
   * deserialization. Optional.
   */
  var FamilySearch = function(options){
    this.appKey = options.appKey;
    this.environment = options.environment || 'sandbox';
    this.redirectUri = options.redirectUri;
    this.saveAccessToken = options.saveAccessToken || true;
    this.tokenCookie = options.tokenCookie || 'FS_AUTH_TOKEN';
    this.maxThrottledRetries = options.maxThrottledRetries || 10;
    this.gedcomx = options.gedcomx;
    
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
  FamilySearch.prototype.request = function(url, options, callback){
    
    var client = this,
        method = 'GET', 
        headers = {},
        body;
    
    // Allow for options to not be given in which case the callback will be
    // the second argument
    if(typeof options === 'function'){
      callback = options;
      options = {};
    }
    
    // Since options are passed by reference, we copy the object to prevent
    // the developer from seeing any modifications which could be especially
    // problematic if they re-use option objects. But we try not to modify the
    // object too much because on redirects we want the request options to be
    // re-processed against the new URL
    options = JSON.parse(JSON.stringify(options));
    
    if(!options._retries){
      options._retries = 0;
    }
    
    if(!callback){
      callback = function(){};
    }
    
    if(options.method){
      method = options.method;
    }
    
    if(options.headers){
      // Copy the headers
      headers = JSON.parse(JSON.stringify(options.headers));
    }
    
    body = options.body;
    
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
    
    // Create the XMLHttpRequest
    var req = new XMLHttpRequest();
    req.open(method, url);
    
    // Set headers
    for(var name in headers){
      if(headers.hasOwnProperty(name)) {
        req.setRequestHeader(name, headers[name]);
      }
    }
    
    // Attach success handler
    req.onload = function(){
      
      // Construct a response object
      var res = {
        statusCode: req.status,
        statusText: req.statusText,
        getHeader: function(name){
          return req.getResponseHeader(name);
        },
        getAllHeaders: function(){
          return req.getAllResponseHeaders();
        },
        originalUrl: url,
        effectiveUrl: url,
        redirected: false,
        requestMethod: method,
        requestHeaders: headers,
        body: req.responseText,
        retries: 0,
        throttled: false
      };
      
      // Catch redirects
      var location = res.getHeader('Location');
      if(res.statusCode === 200 && location && location !== url ){
        return client.request(res.getHeader('Location'), options, function(response){
          if(response){
            response.originalUrl = url;
            response.redirected = true;
          }
          setTimeout(function(){
            callback(response);
          });
        });
      }
      
      if(res.statusCode === 429 && options._retries < client.maxThrottledRetries){
        var retryAfter = parseInt(res.getHeader('Retry'), 10) * 1000 || 1000;
        setTimeout(function(){
          client.request(url, options, function(response){
            response.throttled = true;
            response.retries = ++options._retries;
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
          
          // Create gedcomx-js objects if appropriate
          if(client.gedcomx){
            
            // Atom
            if(res.data.entries){
              res.gedcomx = new client.gedcomx.AtomFeed(res.data);
            }
            
            // OAuth responses
            else if(res.data.access_token){
              // TODO: What format do OAuth responses use?
            }
            
            // GedcomX
            // Error
            else {
              res.gedcomx = new client.gedcomx(res.data);
            }
          }
          
        } catch(e) { 
          // Should we handle this error? how could we?
        }
      }
      
      callback(res);
      
    };
    
    // Attach error handler
    req.onerror = function(error){
      callback();
    };
    
    // Now we can send the request
    req.send(body);
    
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
        return 'https://familysearch.org';
      case 'beta':
        return 'https://beta.familysearch.org';
      default:
        return 'https://sandbox.familysearch.org';
    }
  };
  
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
  
  /*\
  |*|
  |*|  :: cookies.js ::
  |*|
  |*|  A complete cookies reader/writer framework with full unicode support.
  |*|
  |*|  Revision #1 - September 4, 2014
  |*|
  |*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
  |*|  https://developer.mozilla.org/User:fusionchess
  |*|
  |*|  This framework is released under the GNU Public License, version 3 or later.
  |*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
  |*|
  |*|  Syntaxes:
  |*|
  |*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
  |*|  * docCookies.getItem(name)
  |*|  * docCookies.removeItem(name[, path[, domain]])
  |*|  * docCookies.hasItem(name)
  |*|  * docCookies.keys()
  |*|
  \*/
  var cookies = {
    getItem: function (sKey) {
      if (!sKey) { return null; }
      return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
      return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) { return false; }
      document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
      return true;
    },
    hasItem: function (sKey) {
      if (!sKey) { return false; }
      return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: function () {
      var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
      return aKeys;
    }
  };
  
  return FamilySearch;

}));