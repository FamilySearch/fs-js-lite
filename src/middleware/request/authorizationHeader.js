// Set the Authorization header if we have an access token
module.exports = function(client, request, next){
  if(!request.headers['Authorization'] && client.accessToken){
    request.headers['Authorization'] = 'Bearer ' + client.accessToken;
  }
  next();
};