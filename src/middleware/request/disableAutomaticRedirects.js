/**
 * Disable automatic redirects. Useful client-side so that the browser doesn't
 * automatically follow 3xx redirects; that causes problems if the browser
 * doesn't replay all request options such as the Accept header.
 */
module.exports = function(client, request, next){
  if(!request.hasHeader('X-Expect-Override') && request.isPlatform()){
    request.setHeader('X-Expect-Override', '200-ok');
  }
  next();
};