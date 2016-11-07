module.exports = {
  
  /**
   * URL encode an object
   * 
   * http://stackoverflow.com/a/1714899
   * 
   * @param {Object}
   * @return {String}
   */
  urlEncode: function(obj){
    var str = [];
    for(var p in obj){
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    }
    return str.join("&");
  },
  
  /**
   * Get a query parameter by name
   * 
   * http://stackoverflow.com/a/5158301
   */
  getParameterByName: function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
  
};