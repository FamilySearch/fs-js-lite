/**
 * Representation of an HTTP request.
 */
class Request {
  /**
   * @param {String} url
   * @param {Object} options {method, headers, body, retries}
   * @param {Function} callback
   */
  constructor(url, options, callback){

    // Inititialize and set defaults
    this.url = url;
    this.callback = callback || (() => {});
    this.method = 'GET';
    this.headers = {};
    this.retries = 0;
    this.options = {};

    // Process request options. We use a for loop so that we can stuff all
    // non-standard options into the options object on the reuqest.
    for(const opt of Object.keys(options)){
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

  /**
   * Does this request have the specified header?
   *
   * @param {String} header
   * @return {Boolean}
   */
  hasHeader(header){
    return typeof this.headers[header] !== 'undefined';
  }

  /**
   * Set a header on the request
   *
   * @param {String} header
   * @param {String} value
   */
  setHeader(header, value){
    this.headers[header] = value;
    return this;
  }

  /**
   * Get a header's value
   *
   * @param {String} header
   * @return {String} value
   */
  getHeader(header){
    return this.headers[header];
  }

  /**
   * Get all the headers
   *
   * @return {Object} headers
   */
  getHeaders(){
    return this.headers;
  }

  /**
   * Return true if this request is for an API in the /platform/ directory
   *
   * @return {Boolean}
   */
  isPlatform(){
    return this.url.indexOf('/platform/') !== -1;
  }
}

export default Request;