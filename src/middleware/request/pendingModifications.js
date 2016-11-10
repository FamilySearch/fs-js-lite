/**
 * Add headers for enabling pending modifications. Call this method when adding
 * the middleware to pass the header list that will be processed and cached.
 * 
 * `client.addMiddleware(pendingModificationMiddleware(modfifications));`
 * 
 * @param {Array} mods list of modifications
 * @return {Function} middleware
 */
module.exports = function(mods){
  
  // Cache the header value so we don't have to do this on every request
  var headerValue = mods.join(',');
  
  // Return the actual middleware
  return function(client, request, next){
    request.headers['X-FS-Feature-Tag'] = headerValue;
    next();
  };
};