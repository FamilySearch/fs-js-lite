/**
 * Automatically follow a redirect. This behavior is optional because you don't
 * allways want to follow redirects such as when requesting a person's profile.
 *
 * This middleware is enabled per request by setting the `followRedirect` request
 * option to true.
 */
export default (client, request, response, next) => {
  const location = response.headers['location'];
  if(request.options.followRedirect && location && location !== request.url ){
    const originalUrl = request.url;
    request.url = response.headers['location'];
    client._execute(request, (error, response) => {
      if(response){
        response.originalUrl = originalUrl;
        response.redirected = true;
      }
      setTimeout(() => {
        request.callback(error, response);
      });
    });
    return next(undefined, true);
  }
  next();
};