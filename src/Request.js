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
 * Does this request have the specified header?
 * 
 * @param {String} header
 * @return {Boolean}
 */
Request.prototype.hasHeader = function(header){
  return typeof this.headers[header] !== 'undefined';
};

/**
 * Set a header on the request
 * 
 * @param {String} header
 * @param {String} value
 */
Request.prototype.setHeader = function(header, value){
  this.headers[header] = value;
  return this;
};

/**
 * Get a header's value
 * 
 * @param {String} header
 * @return {String} value
 */
Request.prototype.getHeader = function(header){
  return this.headers[header];
};

/**
 * Get all the headers
 * 
 * @return {Object} headers
 */
Request.prototype.getHeaders = function(){
  return this.headers;
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