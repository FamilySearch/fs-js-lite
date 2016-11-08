// Set the Authorization header if we have an access token
module.exports = function(client, request, next){
  if(!request.hasHeader('Authorization') && client.getAccessToken() && request.isPlatform()){
    request.setHeader('Authorization', 'Bearer ' + client.getAccessToken());
  }
  next();
};