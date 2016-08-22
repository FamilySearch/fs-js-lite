[![Build Status](https://travis-ci.org/york-solutions/fs-js-lite.svg?branch=master)](https://travis-ci.org/york-solutions/fs-js-lite)

# FamilySearch Lite JavaScript SDK

Lite JavaScript SDK for the [FamilySearch API](https://familysearch.org/developers/).
This SDK is designed for use in a web browser and uses XMLHttpRequest. 

__Warning__: this SDK requires hard-coding the API endpoint URLs. That is
considered bad practice when using the API. In most cases, FamilySearch does not
consider URL changes as breaking changes. Read more about 
[dealing with change](https://familysearch.org/developers/docs/guides/evolution).

## Usage

The SDK includes a UMD wrapper to support being loaded in AMD environments (RequireJS)
and Node as well as being loaded as a browser global.

```js
// Create a client instance. All available options are shown here for the sake
// of documentation though you normally won't specify all of them.
var fs = new FamilySearch({
  environment: 'production',
  appKey: 'ahfud9Adjfia',
  redirectUri: 'https://example.com/fs-redirect',
  
  // Save the access token in a cookie and load if from a cookie so that the
  // session isn't lost when the page reloads or changes. Defaults to true.
  // Set to false if you will store the access token somewhere else (such as in
  // a session on the server). Use the `tokenCookie` option to change the name
  // of the cookie.
  saveAccessToken: true,
  
  // Name of the cookie where the access token will be stored. Defaults to 'FS_AUTH_TOKEN'
  tokenCookie: 'FS_AUTH_TOKEN',
  
  // Maximum number of times that a throttled request will be retried. Defaults to 10.
  maxThrottledRetries: 10
});

// Begin OAuth by redirecting the user to the login screen on familysearch.org.
// This method will automatically assemble the URL with the proper query parameters
// (such as the redirect URI that was specified when the client was created)
// and forward the user to that URL.
fs.oauthRedirect();

// Handle OAuth redirect response by retrieving the code from the URL query and
// exchanging the code for an access token. The access token will be saved if
// that behavior is enabled.
//
// The method will return false if no code was found in the query paremeter. When
// true is returned it means a code was found and a request was sent to exchange
// the code for an access token. You still must use a callback to check the response
// of that request and verify whether an access token was recieved.
fs.oauthRedirectResponse(function(response){ });

// OAuth password flow. Access tokens will be automatically saved in a cookie
// if that behavior is enabled. The OAuth password flow is disabled by default
// for app keys. Contact Developer Support to inquire about it being enabled for
// your app key. Only mobile and desktop apps are granted permission.
fs.oauthPassword(username, password, function(response){ });

// GET
fs.get('/platform/tree/current-person', function(response){ });

// POST
fs.post('/platform/tree/persons', function(response){ })

// HEAD
fs.head('/platform/tree/persons/PPPP-PPP', function(response){ });

// DELETE
fs.delete('/platform/tree/persons/PPPP-PPP', function(response){ });

// Set the access token. This will also save it in a cookie if that behavior
// is enabled.
fs.setAccessToken(accessToken);

// Get the access token.
fs.getAccessToken();

// Delete the access token.
fs.deleteAccessToken();
```

### Response objects

Responses are objects with the following properties and methods:

* `statusCode` - Integer
* `statusText` - String
* `getHeader()` - Maps to [XMLHttpRequest.getResponseHeader()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getResponseHeader)
* `getAllHeaders()` - Maps to [XMLHttpRequest.getAllResponseHeaders()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders)
* `body` - Response body text, if it exists
* `data` - Object; only exists if the `body` is parsable JSON
* `originalUrl` - String
* `effectiveUrl` - Will be different from `originalUrl` when the request is redirected
* `requestMethod` - HTTP method used on the request
* `requestHeaders` - HTTP headers set on the request
* `redirected` - Boolean specifying whether the request was redirected
* `throttled` - Boolean specifying whether the request was throttled
* `retries` - Integer. Number of times the request was retried. Requests are only retried
  when they are throttled.

### Error handling

There are two types of errors: network errors and HTTP errors. 

For HTTP errors the developer needs access to the response object. The SDK makes
no attempt to interpret HTTP status codes and enable built-in error handling
behaviors. It is the developer's job to interpret and respond to HTTP errors.

XMLHttpRequest gives no insight into network errors. All the developer needs to 
know and can know is that there was a network error and no response is available.
Since no response is available the callback is called with no agruments. Therefore
detecting networks is done by checking for an empty response parameter.

```js
fs.get('/platform/tree/persons/PPPP-PPP', function(response){
  
  if(!response){
    alert('Network error');
  } 

  else if(response.statusCode >= 500){
    alert('Server error');
  }
  
  else if(response.statusCode >= 400){
    alert('Bad request');
  }
  
  else {
    alert('Looking good');
  }
    
})
```

### Redirects

The [XMLHttpRequest](https://dvcs.w3.org/hg/xhr/raw-file/tip/Overview.html#infrastructure-for-the-send%28%29-method)
spec states that redirects should be transparently followed. But that leads to
problems with the FamilySearch API because some browsers won't repeat all of the
same options on the second request. For example, if you request JSON from
`/platform/tree/current-person` by setting the `Accept` header to `application/s-fs-v1+json`,
the API will responsd with a 303 redirect to the actual person URL, such as 
`/platform/tree/persons/PPPP-PPP`. Then browser then will send a second request 
to the new URL but some browsers will not copy the `Accept` header from the first
request to the second request so the API doesn't know you want JSON for the second
request and will responsd with XML since that's the default format. That causes
problems so the API supports a custom `X-Expect-Override` header which instructs
the browser to respond with a 200 status instead of a 303 so XMLHttpRequest
doesn't detect the redirect. That allows the SDK to detect the redirect and respond
accordingly. This also allows the SDK to track both the original URL and the
effective (final) URL which normally isn't possible with XMLHttpRequest. Responses
from redirected requests will have the `redirected` property set to `true`.

### Throttling

The SDK will automatically retry throttled requests and obey the throttling
headers which tell how long to wait until retrying the request. Response objects
include the `retries` property which is an integer specifying how many times the
request was throttled and a `throttled` property which is `true` when the request
has been throttled.

## Testing

The SDK is designed for being used in a browser environment therefore we use
[jsdom](https://github.com/tmpvar/jsdom) for automated testing with a headless 
browser environment. [Nock](https://github.com/node-nock/nock) is used to record
and playback requests so that we don't need to rely on the API being available
for tests, tests are faster, and we don't need to populate the API with data for
testing.