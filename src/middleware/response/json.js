// Parse JSON response
export default (client, request, response, next) => {
  const contentType = response.headers['content-type'];
  if(contentType && contentType.indexOf('json') !== -1){
    // Only attempt to parse if there's a body (empty string or whitespace is not an error)
    if(response.body && response.body.trim()) {
      try {
        response.data = JSON.parse(response.body);
      } catch(e) {
        // Pass JSON parse error to callback for better debugging
        const error = new Error(`Failed to parse JSON response: ${e.message}`);
        error.originalError = e;
        error.response = response;
        return next(error);
      }
    }
  }
  next();
};