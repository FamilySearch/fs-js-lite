var utils = require('../../utils');

// Process a request body
//
// Allow for a string or object. If an object is given then stringify it.
// Try to guess the appropriate `Content-Type` value if it's missing.
module.exports = function(client, request, next){

  if(request.body && (request.method === 'POST' || request.method === 'PUT')){
    
    // Try to guess the content type if it's missing
    if(!request.hasHeader('Content-Type') && request.isPlatform()){
      request.setHeader('Content-Type', 'application/x-fs-v1+json');
    }
    
    // Turn objects into strings
    if(typeof request.body !== 'string'){
      
      // JSON.stringify() if the content-type is JSON
      if(request.hasHeader('Content-Type') && request.getHeader('Content-Type').indexOf('json') !== -1){
        request.body = JSON.stringify(request.body);
      } 
      
      // URL encode
      else {
        request.body = utils.urlEncode(request.body);
      }
      
    }
  }
  
  next();
};