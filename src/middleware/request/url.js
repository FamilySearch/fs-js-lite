// Calculate the URL
//
// For now we just need to know whether the protocol + host were provided
// because if we just received a path such as /platform/tree/persons then
// we want to automatically prepend the platform host.
module.exports = function(client, request, next){
  if(request.url.indexOf('https://') === -1){
    request.url = client.platformHost() + request.url;
  }
  next();
};