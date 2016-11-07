module.exports = function(client, request, response, next){
  var location = response.getHeader('Location');
  if(response.statusCode === 200 && location && location !== request.url ){
    setTimeout(function(){
      var originalCallback = request.callback;
      client.request(response.getHeader('Location'), request, function(response){
        if(response){
          response.originalUrl = request.url;
          response.redirected = true;
        }
        setTimeout(function(){
          originalCallback(response);
        });
      });
    });
    next(true);
  } else {
    next();
  }
};