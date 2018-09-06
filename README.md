[![npm](https://img.shields.io/npm/v/fs-js-lite.svg)](https://www.npmjs.com/package/fs-js-lite)
[![Build Status](https://travis-ci.org/FamilySearch/fs-js-lite.svg?branch=master)](https://travis-ci.org/FamilySearch/fs-js-lite)
[![Coverage Status](https://coveralls.io/repos/github/FamilySearch/fs-js-lite/badge.svg?branch=master)](https://coveralls.io/github/FamilySearch/fs-js-lite?branch=master)

# FamilySearch Lite JavaScript SDK

Lite JavaScript SDK for the [FamilySearch API](https://familysearch.org/developers/).
This SDK is designed for use in a web browser and uses XMLHttpRequest.

There is also an [API Explorer](http://familysearch.github.io/fs-js-lite/docs/console.html)
which is built using the SDK and a [Node.js sample app](https://github.com/FamilySearch/fs-pedigree-browser-node).

__Warning__: this SDK requires hard-coding the API endpoint URLs. That is
considered bad practice when using the API. In most cases, FamilySearch does not
consider URL changes as breaking changes. Read more about 
[dealing with change](https://familysearch.org/developers/docs/guides/evolution).

1. [Install](#install)
2. [Usage](#usage)
    1. [Initialization Options](#init-options)
    2. [Authentication](#authentication)
        1. [Browser](#authentication-browser)
        2. [Node.js](#authentication-node)
    3. [Requests](#requests)
    4. [Responses](#responses)
    5. [Error Handling](#errors)
    6. [Redirects](#redirects)
    7. [Throttling](#throttling)
    8. [Middleware](#middleware)
        1. [Request Middleware](#request-middleware)
        2. [Response Middleware](#response-middleware)
        3. [Default Middleware](#default-middleware)
    9. [Objects Instead of Plain JSON](#objects-json)
3. [Migrating from v1 to v2](#v2-migration)

<a name="install"></a>

## Install

Download or include the SDK directly from the CDN

```html
<script src="https://unpkg.com/fs-js-lite@latest/dist/FamilySearch.min.js"></script>
```

Or install from npm

```
npm install --save fs-js-lite
```
<a name="usage"></a>

## Usage

The SDK includes a UMD wrapper to support being loaded in AMD environments (RequireJS)
and Node as well as being loaded as a browser global.

```js
fs.get('/platform/users/current', function(error, response){
  if(error){
    console.error(error);
  } else {
    console.log(response.data);
  }
});
```
<a name="init-options"></a>

### Initialization Options

```js
// Create a client instance. All available options are shown here for the sake
// of documentation though you normally won't specify all of them.
var fs = new FamilySearch({
  
  // Specify the FamilySearch reference environment that will be used. Options 
  // are: 'production', 'beta', and 'integration'. Defaults to 'integration'.
  environment: 'production',
  
  // App keys are obtained by registering you app in the FamilySearch developer's center.
  // https://familysearch.org/developers/docs/guides/gs1-register-app
  appKey: 'ahfud9Adjfia',
  
  // Required when using OAuth.
  // https://familysearch.org/developers/docs/guides/authentication
  redirectUri: 'https://example.com/fs-redirect',
  
  // Optionally initialize the client with an access token. This is useful when
  // authentication is handled server-side.
  accessToken: 'myaccesstoken',
  
  // Save the access token in a cookie and load if from a cookie so that the
  // session isn't lost when the page reloads or changes. Defaults to false.
  // Use the `tokenCookie` option to change the name of the cookie.
  saveAccessToken: true,
  
  // Name of the cookie where the access token will be stored when `saveAccessToken`
  // is set to `true`. Defaults to 'FS_AUTH_TOKEN'.
  tokenCookie: 'FS_AUTH_TOKEN',
  
  // Path value of the access token cookie.
  // Defaults to the current path (which is probably not what you want).
  tokenCookiePath: '/',
  
  // Maximum number of times that a throttled request will be retried. Defaults to 10.
  maxThrottledRetries: 10,
  
  // List of pending modifications that should be activated.
  pendingModifications: ['consolidate-redundant-resources', 'another-pending-mod'],
  
  // Optional settings that enforces a minimum time in milliseconds (ms) between
  // requests. This is useful for smoothing out bursts of requests and being nice
  // to the API servers. When this parameter isn't set (which is the default)
  // then all requests are immediately sent.
  requestInterval: 1000
  
});
```

You can also change these options later via `config()`. It accepts the same options.

```js
fs.config({
  appKey: 'mynewappkey'
})
```

<a name="authentication"></a>

### Authentication

We recommend reading the FamilySearch [Authentication Guide](https://familysearch.org/developers/docs/guides/authentication)
before deciding which authentication methods are best for you.

__`oauthRedirectURL([state])`__ - Obtain the URL of the login screen on familysearch.org
that the user should be redirected to for initiating authentication via OAuth 2.
This method will automatically assemble the URL with the proper query parameters
(the app key and redirect URI that were specified when the sdk client was created).

__`oauthRedirect([state])`__ - Begin OAuth 2 by automatically redirecting the user to the
login screen on familysearch.org. This only works in the browser as a shortcut
for `window.location.href = fs.oauthRedirectURL();`.

__`oauthToken(code, callback)`__ - In the second step of OAuth 2, exchange the code
for an access token. The access token will be saved if that behavior is enabled.
The `callback` is a normal request callback that recieves `error` and `response`
parameters.

__`oauthUnauthenticatedToken(ipAddress, callback)`__ - Request an 
[unauthenticated access token](https://familysearch.org/developers/docs/guides/authentication#unauthenticated-access-tokens).
The access token will be saved if that behavior is enabled. `ipAddress` is the
IP address of the user. The `callback` is a normal request callback that recieves
`error` and `response` parameters.

__`oauthResponse([state,] callback)`__ - When handling the OAuth 2 response in the browser,
call this method which is automatically extract the `code` from the query
parameter and call `oauthToken()` for you. The method will return `false` if no
code was found in the query paremeter or when the optional state parameter is
given and it doesn't match the state paremeter in the query. `true` is returned
when a code was found and a request was sent to exchange the code for an access 
token. In that case you still must use a callback to check the response of that
request and verify whether an access token was received.

__`oauthPassword(username, password, callback)`__ - Use the OAuth password flow.
Access tokens will be automatically saved in a cookie if that behavior is
enabled. The OAuth password flow is disabled by default for app keys. Contact
Developer Support to inquire about it being enabled for your app key. Typically
only mobile and desktop apps are granted permission.

__`setAccessToken(accessToken)`__ - Set the access token. This will also save it in
a cookie if that behavior is enabled.

__`getAccessToken()`__ - Get the access token if one is set. This does not send a
request to the API to initiate authentication, it just returns what is currently
stored in the sdk client's properties.

__`deleteAccessToken()`__ - Delete the access token. This doesn't actually invalidate
the access token it just removes it from the sdk client.

<a name="authentication-browser"></a>

#### Authentication in the Browser

Authentication can be completely handled in the browser. First you would call
`oauthRedirect()` to send the user to the login screen on familysearch.org. Then
when the user returns to your app you would call `oauthResponse()` to complete
authentication. You would also likely want to set the `saveAccessToken` to `true`
when instantiating the SDK.

<a name="authentication-node"></a>

#### Authentication in Node.js

When handling authentication on the server, you first redirect the user to the URL
returned by `oauthRedirectURL()`. Then when the user returns to your app you
will retrieve the `code` from the query paremeters and call `oauthToken()` to
complete authentication. When authentication is finished you would typically
save the access token in a session so that the user remains authenticated
between page loads. See the [node sample app](https://github.com/FamilySearch/fs-pedigree-browser-node)
for an example of how this can be done with [Express](http://expressjs.com/).

You can also use a mixed approach to authentication by beginning in the browser
with the redirect to familysearch.org and handling the response on the server.

<a name="requests"></a>

### Requests

```js
// GET
fs.get('/platform/users/current', function(error, response){ });

// POST
fs.post('/platform/tree/persons', {
  body: { persons: [ personData ] }
}, function(error, response){ });

// HEAD
fs.head('/platform/tree/persons/PPPP-PPP', function(error, response){ });

// DELETE
fs.delete('/platform/tree/persons/PPPP-PPP', function(error, response){ });

// The SDK defaults the Accept and Content-Type headers to application/x-fs-v1+json
// for all /platform/ URLs. But that doesn't work for some endpoints which use
// the atom data format so you'll need to set the headers yourself.
fs.get('/platform/tree/persons/PPPP-PPP/matches?collection=records', {
  headers: {
    Accept: 'application/x-gedcomx-atom+json'
  }
}, function(error, response){ });

// Underneath the covers, `get()`, `post()`, `head()`, and `delete()` call the
// `request()` method which has the same method signature.
fs.request('/platform/tree/persons/PPPP-PPP', {
  method: 'POST',
  body: { persons: [ personData ] }
}, function(error, response){ });

// The options object is optional. When options are not include, the SDK will
// automatically detect that the callback is the second parameter.
// The `method` defaults to 'GET'.
fs.request('/platform/tree/persons/PPPP-PPP', function(error, response){ });
```

Request options:

* __`method`__ - The HTTP method. Supported methods are `GET`, `POST`, `HEAD`, and 
`DELETE`. Defaults to `GET`.
* __`headers`__ - HTTP request headers in an object where header names are keys. The
SDK will default `Accept` and `Content-Type` to `application/x-fs-v1+json`. Usually
that's what you want but some endpoints require `application/x-gedcomx-atom+json`
so you'll have to specifically set that.
* __`body`__ - The request body. Only valid when the `method` is `POST`. The body 
may be a string or an object.

Any other options you include in the request will be made available to 
middleware at `request.options`. This allows you to pass request options to 
custom middleware.

<a name="responses"></a>

### Responses

Responses are objects with the following properties and methods:

* __`statusCode`__ - Integer
* __`statusText`__ - String
* __`headers`__ - Map of the response headers. Header names are lowercased.
* __`body`__ - Response body text, if it exists
* __`data`__ - Object; only exists if the `body` is parsable JSON
* __`originalUrl`__ - String
* __`effectiveUrl`__ - Will be different from `originalUrl` when the request is redirected
* __`requestMethod`__ - HTTP method used on the request
* __`requestHeaders`__ - HTTP headers set on the request
* __`redirected`__ - Boolean specifying whether the request was redirected
* __`throttled`__ - Boolean specifying whether the request was throttled
* __`retries`__ - Integer. Number of times the request was retried. Requests are only retried
  when they are throttled.

<a name="errors"></a>

### Error Handling

There are two types of errors: network errors and HTTP errors. 

For HTTP errors the developer needs access to the response object. The SDK makes
no attempt to interpret HTTP status codes and enable built-in error handling
behaviors. It is the developer's job to interpret and respond to HTTP errors.

Network errors are returned as the first argument to response callbacks.

```js
fs.get('/platform/tree/persons/PPPP-PPP', function(error, response){
  
  if(error){
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
    
});
```

<a name="redirects"></a>

### Redirects

Redirects are not automatically followed by the SDK. Usually you'll want to
automatically follow the redirects but in some cases such as fetching portraits
you just want to know what the redirect URL is but not actually follow it. Thus
you must specify via a request option when you want the SDK to follow the redirect.

```js
client.get('/platform/tree/current-person', {
  followRedirect: true
});
```

<a name="throttling"></a>

### Throttling

The SDK will automatically retry throttled requests and obey the throttling
headers which tell how long to wait until retrying the request. Response objects
include the `retries` property which is an integer specifying how many times the
request was throttled and a `throttled` property which is `true` when the request
has been throttled.

<a name="middleware"></a>

### Middleware

The SDK allows for customizing the request and response processing via middleware.
Middleware can be used to support caching, logging, and other features.

<a name="request-middleware"></a>

#### Request Middleware

```js
// Add request middleware to log all requests
fs.addRequestMiddlware(function(client, request, next){
  console.log(request.method + ' ' + request.url);
  next();
});
```

Request middleware is applied to every request the API makes. Request middleware 
is a function with the signature `(client, request, next)`.

* `client` is the instance of the FamilySearch sdk that the request is associated
with.
* `request` is an object that has {url, method, headers, body}.
* `next` is a method that must be called when the middleware is done. Its
signature is `function(error, response)`. In most cases nothing will be returned.
When an error is returned the middleware chain will be canceled and the error
will be returned to the request callback. A response may be returned by the
middleware to enable caching. In this case the response is immediately returned.

Request middleware is applied in the order that it was added.
The SDK sets up some request middleware by default.

<a name="response-middleware"></a>

#### Response Middleware

```js
// Add response middleware to log all responses
fs.addResponseMiddlware(function(client, request, response, next){
  console.log(response.originalUrl + ' ' + response.statusText);
  next();
});
```

Response middleware is applied to every response received from the API. Response 
middleware is a function with the signature `(client, request, response, next)`.

* `client` is the instance of the FamilySearch sdk that the request is associated
* with.
* `request` is an object that has {url, method, headers, body}.
* `response` is a response object.
* `next` is a method that must be called when the middleware is done. Its
signature is `function(error, cancel)`. When `cancel` has any truthy value
the response middleware chain is canceled but unlike request
middleware the request callback is not called. Cancelling is done when a new
request must be issued, such as middleware that handles redirects or throttling.
In this case the subsequent request will have it's own middleware chain.

Response middleware is applied in the order that it was added. 
The SDK sets up some response middleware by default.

<a name="default-middleware"></a>

#### Default Middlware

Some request and response middleware is configured by default for processing
request bodies, handling throttling, and other default functionality.

At the moment there is no official way to modify the default middleware. Visit
[issue 6](https://github.com/FamilySearch/fs-js-lite/issues/6) to voice your
support for this functionality and express your opinion on how it should be done.

<a name="objects-json"></a>

### Objects Instead of Plain JSON

If you would prefer having response bodies deserialized with an object model
instead of traversing plain JSON objects then you can register response middleware
to use [gedcomx-fs-js](https://github.com/rootsdev/gedcomx-fs-js).

```js
// First you need to setup gedcomx-js and gedcomx-fs-js. See those libraries
// for instructions. Here we will assume they are available in the current
// scope as `GedcomX`.

// Then we register the middleware. When a response has a body, the body is 
// deserialized into an object model provided by gedcomx-js and made available
// on the request via the `gedcomx` attribute.
fs.addResponseMiddleware(function(client, request, response, next){
  if(response.data){
    if(response.data.entries){
      response.gedcomx = GedcomX.AtomFeed(response.data);
    }
    else if(response.data.access_token){
      response.gedcomx = GedcomX.OAuth2(response.data);
    }
    else if(response.data.errors) {
      response.gedcomx = GedcomX.Errors(response.data);
    }
    else {
      response.gedcomx = GedcomX(response.data);
    }
  }
  next();
});
```

<a name="v2-migration"></a>

## Migrating from v1 to v2

Breaking changes:

1. The `getHeader()` and `getAllHeaders()` response methods were replaced with
the `headers` object.
2. `saveAccessToken` now defaults to `false` instead of `true`.
3. The signature of response callbacks changed from `function(response)` to
`function(error, response)`.
4. In v1 response middleware was called even when a network error occurred. In
v2 the response middleware is only called when a response is actually recieved.
5. Redirects are not automatically followed. Use the `followRedirect: true`
request option to have the SDK automatically follow a redirect response.
