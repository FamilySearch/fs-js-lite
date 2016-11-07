module.exports = function(client, request, response, next){
  var location = response.getHeader('Location');
  if(response.statusCode === 200 && location && location !== request.url ){
    setTimeout(function(){
      var originalUrl = request.url;
      request.url = response.getHeader('Location');
      client._execute(request, function(response){
        if(response){
          response.originalUrl = originalUrl;
          response.redirected = true;
        }
        setTimeout(function(){
          request.callback(response);
        });
      });
    });
    next(true);
  } else {
    next();
  }
};