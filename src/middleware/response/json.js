// Parse JSON response
module.exports = function(client, request, response, next){
  var contentType = response.headers['content-type'];
  if(contentType && contentType.indexOf('json') !== -1){
    try {
      response.data = JSON.parse(response.body);
    } catch(e) { 
      // Should we handle this error? how could we?
    }
  }
  next();
};