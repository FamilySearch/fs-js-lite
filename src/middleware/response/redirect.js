/**
 * Automatically follow a redirect. This behavior is optional because you don't
 * always want to follow redirects such as when requesting a person's profile.
 *
 * This middleware is enabled per request by setting the `followRedirect` request
 * option to true.
 *
 * Security: Redirects are validated against the client's allowedRedirectDomains
 * configuration (defaults to FamilySearch domains). External developers can
 * customize this list for their integration needs.
 */
export default (client, request, response, next) => {
  const location = response.headers['location'];
  if(request.options.followRedirect && location && location !== request.url ){
    try {
      const redirectUrl = new URL(location, request.url);

      // Security check: Validate redirect domain if allowedRedirectDomains is configured
      if (client.allowedRedirectDomains !== null && Array.isArray(client.allowedRedirectDomains)) {
        const isAllowedDomain = client.allowedRedirectDomains.some(domain =>
          redirectUrl.hostname === domain || redirectUrl.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowedDomain) {
          // Reject redirect to unauthorized domain
          const error = new Error(
            `Redirect to unauthorized domain: ${redirectUrl.hostname}. ` +
            `Allowed domains: ${client.allowedRedirectDomains.join(', ')}`
          );
          setTimeout(() => {
            request.callback(error);
          });
          return next(undefined, true);
        }
      }

      // Additional security: Only allow HTTPS redirects (unless original request was HTTP)
      const originalUrl = new URL(request.url);
      if (redirectUrl.protocol === 'http:' && originalUrl.protocol === 'https:') {
        const error = new Error(`Redirect from HTTPS to HTTP is not allowed: ${location}`);
        setTimeout(() => {
          request.callback(error);
        });
        return next(undefined, true);
      }

      const originalUrlString = request.url;
      request.url = redirectUrl.href;
      client._execute(request, (error, response) => {
        if(response){
          response.originalUrl = originalUrlString;
          response.redirected = true;
        }
        setTimeout(() => {
          request.callback(error, response);
        });
      });
      return next(undefined, true);
    } catch (error) {
      // Invalid URL, reject the redirect
      setTimeout(() => {
        request.callback(new Error(`Invalid redirect URL: ${location}`));
      });
      return next(undefined, true);
    }
  }
  next();
};