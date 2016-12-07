/**
 * Automatically follow a redirect. This behavior is optional because you don't
 * allways want to follow redirects such as when requesting a person's profile.
 * 
 * This middleware is enabled per request by setting the `followRedirect` request 
 * option to true.
 */
module.exports = function(client, request, response, next){
  var location = response.headers['location'];
  if(request.options.followRedirect && location && location !== request.url ){
    var originalUrl = request.url;
    request.url = response.headers['location'];
    client._execute(request, function(error, response){
      if(response){
        response.originalUrl = originalUrl;
        response.redirected = true;
      }
      setTimeout(function(){
        request.callback(error, response);
      });
    });
    return next(undefined, true);
  }
  next();
};