// UMD Wrapper
// https://github.com/umdjs/umd/blob/95563fd6b46f06bda0af143ff67292e7f6ede6b7/templates/commonjsStrict.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory(root);
  }
}(this, function (exports) {

  /**
   * Create an instance of the FamilySearch SDK Client
   * 
   * @param {Object} options
   * @param {String} options.environment Reference environment: production, beta,
   * or sandbox. Defaults to sandbox.
   * @param {String} options.appKey Application Key
   * @param {String} options.redirectUri OAuth2 redirect URI
   * @param {String} options.tokenCookie Name of the cookie that the access token
   * will be saved in.
   */
  var FamilySearch = function(options){
    this.appKey = options.appKey;
    this.environment = options.environment || 'sandbox';
    this.redirectUri = options.redirectUri;
    this.tokenCookie = options.tokenCookie || 'FS_AUTH_TOKEN';
  };
  
  /**
   * OAuth2 password authentication
   * 
   * @param {String} username
   * @param {String} password
   * @param {Function} callback
   */
  FamilySearch.prototype.oauthPassword = function(username, password, callback){
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
    }, callback);
  };
  
  /**
   * Execute an HTTP POST
   * 
   * @param {String} url
   * @param {Object=} options See request() for an explanation of the options
   * @param {Function} callback
   */
  FamilySearch.prototype.post = function(url, options, callback){
    
    // Allow for options to not be given in which case the callback will be
    // the second argument
    if(typeof options === 'function'){
      callback = options;
      options = {};
    }
    
    options.method = 'POST';
    
    this.request(url, options, callback);
  };
  
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
    
    var method = 'GET', 
        headers = {},
        body;
    
    // Allow for options to not be given in which case the callback will be
    // the second argument
    if(typeof options === 'function'){
      callback = options;
      options = {};
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
    
    // Process the body
    //
    // Allow for a string or object. If an object is given then stringify it.
    // Try to guess the appropriate `Content-Type` value if it's missing.
    if(body && (method === 'POST' || method === 'PUT')){
      
      // Try to guess the content type if it's missing
      if(!headers['Content-Type'] && url.indexOf('/platform/') !== -1){
        headers['Content-Type'] = 'application/x-fs-v1+json';
      }
      
      // Turn objects into strings
      if(typeof body !== 'string'){
        
        // JSON.stringify() if the content-type is JSON
        if(headers['Content-Type'] && headers['Content-Type'].indexOf('json')){
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
      callback(req);
    };
    
    // Attach error handler
    req.onerror = function(){
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

}));