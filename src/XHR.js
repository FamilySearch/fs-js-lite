/**
 * XMLHttpRequest wrapper
 * 
 * @param {Object} request {url, method, headers, body, retries}
 * @param {Function} callback function(response)
 */
module.exports = function(request, callback){
  
  // Create the XMLHttpRequest
  var xhr = new XMLHttpRequest();
  xhr.open(request.method, request.url);
  
  // Set headers
  for(var name in request.headers){
    if(request.headers.hasOwnProperty(name)) {
      xhr.setRequestHeader(name, request.headers[name]);
    }
  }
  
  // Attach response handler
  xhr.onload = function(){
    createResponse(xhr, request, callback);
  };
  
  // Attach error handler
  xhr.onerror = function(error){
    callback();
  };
  
  // Now we can send the request
  xhr.send(request.body);
  
};

/**
 * Convert an XHR response to a standard response object
 * 
 * @param {XMLHttpRequest} xhr
 * @param {Object} request {url, method, headers, retries}
 * @param {Function} callback function(response)
 */
function createResponse(xhr, request, callback){
  setTimeout(function(){
    callback({
      statusCode: xhr.status,
      statusText: xhr.statusText,
      getHeader: function(name){
        return xhr.getResponseHeader(name);
      },
      getAllHeaders: function(){
        return xhr.getAllResponseHeaders();
      },
      originalUrl: request.url,
      effectiveUrl: request.url,
      redirected: false,
      requestMethod: request.method,
      requestHeaders: request.headers,
      body: xhr.responseText,
      retries: 0,
      throttled: false
    });
  });
}