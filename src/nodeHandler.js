/**
 * Request handler used in node.js
 */

var axios = require('axios');

module.exports = function(req, callback){
  // Configure axios request
  axios({
    url: req.url,
    method: req.method,
    headers: req.headers,
    data: req.body,
    maxRedirects: 0,
    // Prevent axios from throwing on 4xx/5xx status codes
    // (request library doesn't throw, so we preserve that behavior)
    validateStatus: function() {
      return true;
    }
  })
  .then(function(res){
    var response = createResponse(req, res);
    setTimeout(function(){
      callback(null, response);
    });
  })
  .catch(function(error){
    // Handle network errors, timeouts, etc.
    // These are real errors (not just 4xx/5xx status codes)
    var response;
    if(error.response){
      // Got a response but validateStatus should prevent this
      response = createResponse(req, error.response);
    }
    setTimeout(function(){
      callback(error, response);
    });
  });
};

/**
 * Convert an axios response to a standard sdk response object
 *
 * @param {Object} request {url, method, headers, retries}
 * @param {Object} response axios response object
 * @return {Object} response
 */
function createResponse(request, response){
  return {
    statusCode: response.status,
    statusText: response.statusText,
    headers: response.headers,
    originalUrl: request.url,
    effectiveUrl: request.url,
    redirected: false,
    requestMethod: request.method,
    requestHeaders: request.headers,
    body: typeof response.data === 'object' ? JSON.stringify(response.data) : (response.data || ''),
    retries: 0,
    throttled: false
  };
}