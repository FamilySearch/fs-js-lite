// Set the Accept header if it's missing on /platform URLs
module.exports = function(client, request, next){
  if(!request.headers['Accept'] && request.isPlatform()){
    request.headers['Accept'] = 'application/x-fs-v1+json';
  }
  next();
};