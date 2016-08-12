# FamilySearch Lite JavaScript SDK

Lite JS SDK for the [FamilySearch API](https://familysearch.org/developers/)

__This library is in the early stages of brainstorming__

## Usage

```js
var fs = new FamilySearch({
  environment: 'production',
  appKey: 'ahfud9Adjfia',
  redirectUri: 'https://example.com/fs-redirect',
  tokenCookie: 'FS_AUTH_TOKEN'
});

// OAuth via client-side popup
fs.oauthPopup(function(response){
  
});

// OAuth redirect
fs.oauthRedirect();

// Handle OAuth redirect response
fs.oauthRedirectResponse(function(response){
  
});

// OAuth password flow
fs.oauthPassword(username, password, function(response){
  
});

// GET
fs.get('/platform/tree/current-person', function(response){ });

// POST
fs.post('/platform/tree/persons', function(response){ })

// HEAD
fs.head('/platform/tree/persons/PPPP-PPP', function(response){ });

// DELETE
fs.delete('/platform/tree/persons/PPPP-PPP', function(response){ });

// Error handling.
// 
// There are two types of errors: network errors and http errors. XMLHttpRequest
// gives no insight into network errors so all the developer needs to know and
// can know is that there was a network error and the request never made it to
// the intended location (or the response never returned). In terms of HTTP
// errors the developer just needs access to the response object. Therefore I
// propose that instead of the node.js style of function(error, response) we
// just have function(response) and return nothing when there's a network error.
```