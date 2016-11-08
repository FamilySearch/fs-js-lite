// Disable automatic redirects
module.exports = function(client, request, next){
  if(!request.hasHeader('X-Expect-Override') && request.isPlatform()){
    request.setHeader('X-Expect-Override', '200-ok');
  }
  next();
};