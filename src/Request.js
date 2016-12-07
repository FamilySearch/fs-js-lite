/**
 * Representation of an HTTP request.
 * 
 * @param {String} url
 * @param {Object} options {method, headers, body, retries}
 * @param {Function} callback
 */
var Request = function(url, options, callback){
  
  // Inititialize and set defaults
  this.url = url;
  this.callback = callback || function(){};
  this.method = 'GET';
  this.headers = {};
  this.retries = 0;
  this.options = {};
  
  // Process request options. We use a for loop so that we can stuff all
  // non-standard options into the options object on the reuqest.
  var opt;
  for(opt in options){
    if(options.hasOwnProperty(opt)){
      switch(opt){
        
        case 'method':
        case 'body':
        case 'retries':
          this[opt] = options[opt];
          break;
          
        case 'headers':
          // We copy the headers object so that we don't have to worry about the developer
          // and the SDK stepping on each other's toes by modifying the headers object.
          this.headers = JSON.parse(JSON.stringify(options.headers));
          break;
          
        default:
          this.options[opt] = options[opt];
      }
    }
  }
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