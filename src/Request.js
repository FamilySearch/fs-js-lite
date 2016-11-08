/**
 * Representation of an HTTP request.
 * 
 * @param {String} url
 * @param {Object} options {method, headers, body, retries}
 * @param {Function} callback
 */
var Request = function(url, options, callback){
  this.url = url;
  this.method = options.method || 'GET';
  this.headers = options.headers ? JSON.parse(JSON.stringify(options.headers)) : {};
  this.body = options.body;
  this.retries = options.retries || 0;
  this.callback = callback || function(){};
};

/**
 * Return true if this request is for an API in the /platform/ directory
 * 
 * @return {Boolean}
 */
Request.prototype.isPlatform = function(){
  return this.url.indexOf('/platform/') !== -1;
};

module.exports = Request;