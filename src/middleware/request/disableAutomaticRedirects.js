// Disable automatic redirects
module.exports = function(client, request, next){
  if(!request.headers['X-Expect-Override'] && request.isPlatform()){
    request.headers['X-Expect-Override'] = '200-ok';
  }
  next();
};