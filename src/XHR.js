/**
 * XMLHttpRequest wrapper
 * 
 * @param {Object} options {url, method, headers, body, retries}
 * @param {Function} callback function(response)
 */
module.exports = function(options, callback){
  
  // Create the XMLHttpRequest
  var req = new XMLHttpRequest();
  req.open(options.method, options.url);
  
  // Set headers
  for(var name in options.headers){
    if(options.headers.hasOwnProperty(name)) {
      req.setRequestHeader(name, options.headers[name]);
    }
  }
  
  // Attach response handler
  req.onload = function(){
    processResponse(req, options, callback);
  };
  
  // Attach error handler
  req.onerror = function(error){
    callback();
  };
  
  // Now we can send the request
  req.send(options.body);
  
};

/**
 * Convert an XHR response to a standard response object
 * 
 * @param {XMLHttpRequest} req
 * @param {Object} options {url, method, headers, retries}
 * @param {Function} callback function(response)
 */
function processResponse(req, options, callback){
  setTimeout(function(){
    callback({
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
    });
  });
}