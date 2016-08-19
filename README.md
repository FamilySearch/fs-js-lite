[![Build Status](https://travis-ci.org/york-solutions/fs-js-lite.svg?branch=master)](https://travis-ci.org/york-solutions/fs-js-lite)

# FamilySearch Lite JavaScript SDK

Lite JS SDK for the [FamilySearch API](https://familysearch.org/developers/)

## Usage

```js
// Create a client instance
var fs = new FamilySearch({
  environment: 'production',
  appKey: 'ahfud9Adjfia',
  redirectUri: 'https://example.com/fs-redirect',
  tokenCookie: 'FS_AUTH_TOKEN'
});

// OAuth redirect
fs.oauthRedirect();

// Handle OAuth redirect response
fs.oauthRedirectResponse(function(response){ });

// OAuth password flow
fs.oauthPassword(username, password, function(response){ });

// GET
fs.get('/platform/tree/current-person', function(response){ });

// POST
fs.post('/platform/tree/persons', function(response){ })

// HEAD
fs.head('/platform/tree/persons/PPPP-PPP', function(response){ });

// DELETE
fs.delete('/platform/tree/persons/PPPP-PPP', function(response){ });
```

### Response objects

Responses are objects with the following properties and methods:

* `statusCode`
* `statusText`
* `getHeader()` - maps to [XMLHttpRequest.getResponseHeader()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getResponseHeader)
* `getAllHeaders()` - maps to [XMLHttpRequest.getAllResponseHeaders()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders)
* `body` - body text
* `data` - only exists if the `body` is parsable JSON
* `originalUrl`
* `effectiveUrl` - Will be different from `originalUrl` when the request is redirected
* `requestMethod` - HTTP method used on the request
* `requestHeaders` - HTTP headers set on the request
* `redirected` - Boolean specifying whether the request was redirected
* `throttled` - Boolean specifying whether the request was throttled
* `retries` - Number of times the request was retried. Requests are only retried
  when they are throttled.

### Error handling

There are two types of errors: network errors and http errors. XMLHttpRequest
gives no insight into network errors so all the developer needs to know and
can know is that there was a network error and the request never made it to
the intended location (or the response never returned). In terms of HTTP
errors the developer just needs access to the response object. Therefore I
propose that instead of the node.js style of function(error, response) where
`error` would always undefined or an `Error()` with no helpful message, we
just have function(response) and return nothing when there's a network error.

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