// Automatically replay all throttled requests
export default (client, request, response, next) => {
  // Throttled responses have an HTTP status code of 429. We also check to make
  // sure we haven't maxed out on throttled retries.
  if(response.statusCode === 429 && request.retries < client.maxThrottledRetries){

    // Throttled responses include a retry header that tells us how long to wait
    // until we retry the request
    const retryAfter = parseInt(response.headers['retry'] || response.headers['retry-after'], 10) * 1000 || 1000;
    setTimeout(() => {
      client._execute(request, (error, response) => {
        response.throttled = true;
        response.retries = ++request.retries;
        setTimeout(() => {
          request.callback(error, response);
        });
      });
    }, retryAfter);
    return next(undefined, true);
  }
  next();
};