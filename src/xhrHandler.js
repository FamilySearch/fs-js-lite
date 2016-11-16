/**
 * XMLHttpRequest wrapper used for making requests in the browser
 * 
 * @param {Object} request {url, method, headers, body, retries}
 * @param {Function} callback function(response)
 */
 
var headersRegex = /^(.*?):[ \t]*([^\r\n]*)$/mg;

module.exports = function(request, callback){
  
  // Create the XMLHttpRequest
  var xhr = new XMLHttpRequest();
  xhr.open(request.method, request.url);
  
  // Set headers
  var headers = request.getHeaders();
  for(var name in headers){
    if(headers.hasOwnProperty(name)) {
      xhr.setRequestHeader(name, headers[name]);
    }
  }
  
  // Attach response handler
  xhr.onload = function(){
    var response = createResponse(xhr, request);
    setTimeout(function(){
      callback(null, response);
    });
  };
  
  // Attach error handler
  xhr.onerror = function(error){
    setTimeout(function(){
      callback(error);
    });
  };
  
  // Now we can send the request
  xhr.send(request.body);
  
};

/**
 * Convert an XHR response to a standard response object
 * 
 * @param {XMLHttpRequest} xhr
 * @param {Object} request {url, method, headers, retries}
 * @return {Object} response
 */
function createResponse(xhr, request){
  
  // XHR header processing borrowed from jQuery
  var responseHeaders = {}, match;
  while ((match = headersRegex.exec(xhr.getAllResponseHeaders()))) {
		responseHeaders[match[1].toLowerCase()] = match[2];
	}
	
  return {
    statusCode: xhr.status,
    statusText: xhr.statusText,
    headers: responseHeaders,
    originalUrl: request.url,
    effectiveUrl: request.url,
    redirected: false,
    requestMethod: request.method,
    requestHeaders: request.headers,
    body: xhr.responseText,
    retries: 0,
    throttled: false
  };
}