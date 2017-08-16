/**
 * Enforce a minimum interval between requests.
 * See https://github.com/FamilySearch/fs-js-lite/issues/30
 * 
 * @param {Integer} interval Minimum time between requests, in milliseconds (ms)
 * @return {Function} middleware
 */
module.exports = function(interval) {
  
  var lastRequestTime = 0,
      requestQueue = [],
      timer;
  
  /**
   * Add a request to the queue
   * 
   * @param {Function} next The next method that was sent to the middleware with the request.
   */
  function enqueue(next) {
    requestQueue.push(next);
    startTimer();
  }
  
  /**
   * Start the timer that checks for when a request in the queue is ready to go.
   * This fires every {interval} ms to enforce a minimum time between requests.
   * The actual time between requests may be longer.
   */
  function startTimer() {
    if(!timer) {
      timer = setInterval(checkQueue, interval);
    }
  }
  
  /**
   * Check to see if we're ready to send any requests.
   */
  function checkQueue() {
    if(!inInterval()) {
      if(requestQueue.length) {
        var next = requestQueue.shift();
        sendRequest(next);
      } else if(timer) {
        clearInterval(timer); // No need to leave the timer running if we don't have any requests.
      }
    }
  }
  
  /**
   * Send a request by calling it's next() method and mark the current time so
   * that we can accurately enforce the interval.
   */
  function sendRequest(next) {
    lastRequestTime = Date.now();
    next();
  }
  
  /**
   * Returns true if the most recent request was less then {interval} ms in the past
   * 
   * @return {Boolean}
   */
  function inInterval() {
    return Date.now() - lastRequestTime < interval;
  }
  
  return function(client, request, next) {
    
    // If there are any requests in the queue or if the previous request was issued
    // too recently then add this request to the queue.
    if(requestQueue.length || inInterval()) {
      enqueue(next);
    }
    
    else {
      sendRequest(next);
    }
  };
  
};