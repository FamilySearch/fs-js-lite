module.exports = function(client, request, response, next){
  var location = response.headers['location'];
  if(response.statusCode === 200 && location && location !== request.url ){
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