# FamilySearch Lite JavaScript SDK

Lite JS SDK for the [FamilySearch API](https://familysearch.org/developers/)

__This library is in the early stages of brainstorming__

## Usage

```js
// Create a client instance
var fs = new FamilySearch({
  environment: 'production',
  appKey: 'ahfud9Adjfia',
  redirectUri: 'https://example.com/fs-redirect',
  tokenCookie: 'FS_AUTH_TOKEN'
});

// OAuth via client-side popup
fs.oauthPopup(function(response){ });

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

Data we want:

* Status code
* Status text
* Headers
* Body text
* Parsed body when the content type is JSON
* Requested URL
* Effective URL
* Redirected?
* Throttled?

Responses are objects with the following properties and methods:

* `statusCode`
* `statusText`
* `getHeader()` - maps to [XMLHttpRequest.getResponseHeader()](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getResponseHeader)
* `body` - body text
* `data` - only exists if the `body` is parsable JSON

### Redirection

The XMLHttpRequest states the redirects must be followed transparently. But that
has previously led to bugs with the API because some browsers don't replay the
original headers such as `Content-Type` which causes the API respond with the
default format of XML. So the API allows a [work-around](https://groups.google.com/a/ldsmail.net/d/msg/FSDN/pmeDFTspA4c/aTTHlddbv5QJ)
by setting the `Expect` or `X-Expect-Override` header to `200-ok`. This tells the API
to return a 200 with a `Location` header instead of a 3xx response. Thus the
browser won't autoamtically follow the redirect but the developer can.

Therefore, the transparent following of redirects is not a problem for us. We
___have to___ handle it manually which means we always know when a request was
redirected and we always know both the original and final URLs.

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