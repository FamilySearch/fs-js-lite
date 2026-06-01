const utils = {

  /**
   * URL encode an object
   *
   * http://stackoverflow.com/a/1714899
   *
   * @param {Object}
   * @return {String}
   */
  urlEncode(obj){
    const str = [];
    for(const p of Object.keys(obj)){
      str.push(`${encodeURIComponent(p)}=${encodeURIComponent(obj[p])}`);
    }
    return str.join("&");
  },

  /**
   * Get a query parameter by name
   *
   * http://stackoverflow.com/a/5158301
   */
  getParameterByName(name) {
    const match = RegExp(`[?&]${name}=([^&]*)`).exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  },

  /**
   * Iterate over data asynchronously in series.
   *
   * @param {Array} list
   * @param {Function} iterator function(item, next)
   * @param {Function} finished function()
   */
  asyncEach(data, iterator, callback){
    function nextCall(i){
      if(i === data.length){
        setTimeout(callback);
      } else {
        iterator(data[i], () => {
          setTimeout(() => {
            nextCall(++i);
          });
        });
      }
    }
    nextCall(0);
  }

};

export default utils;