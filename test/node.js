var FamilySearch = require('../src/FamilySearch'),
    assert = require('chai').assert,
    nockBack = require('./nockback'),
    GedcomX = require('gedcomx-js'),
    sandbox = require('./sandbox'),
    createPerson = require('./createperson'),
    check = require('./check');

GedcomX.addExtensions(require('gedcomx-fs-js'));

describe('node', function(){
  
  describe('basic', function(){
  
    var client;
  
    before(function(done){
      authenticatedClient(function(c){
        client = c;
        done();
      });
    });
    
    it('oauthRedirectURL()', function(){
      assert.equal(client.oauthRedirectURL(), 'https://integration.familysearch.org/cis-web/oauth2/v3/authorization?response_type=code&client_id=a02j000000JBxOxAAL&redirect_uri=http://foobaz.com/oauth-redirect');
    });
    
    it('oauthRedirectURL(state)', function(){
      assert.equal(client.oauthRedirectURL('state123'), 'https://integration.familysearch.org/cis-web/oauth2/v3/authorization?response_type=code&client_id=a02j000000JBxOxAAL&redirect_uri=http://foobaz.com/oauth-redirect&state=state123');
    });
    
    it('oauthUnauthenticatedToken()', function(done){
      nockBack('unauthenticated.json', function(nockDone){
        client.oauthUnauthenticatedToken('192.168.1.1', function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isDefined(response.data.token);
          });
        });
      });
    });
  
    it('password', function(done){
      nockBack('oauthPassword.json', function(nockDone){
        client.oauthPassword(sandbox.username, sandbox.password, function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isDefined(response.data.token);
          });
        });
      });
    });
  
    it('get', function(done){
      nockBack('getPerson.json', function(nockDone){
        createPerson(client, function(personId){
          client.get('/platform/tree/persons/' + personId, function(error, response){
            nockDone();
            check(done, function(){
              assert.isDefined(response);
              assert.equal(response.statusCode, 200);
              assert.isDefined(response.data);
              assert.isDefined(response.data.persons);
            });
          });
        });
      });
    });
    
    it('post', function(done){
      this.timeout(10000);
      nockBack('createPerson.json', function(nockDone){
        createPerson(client, function(personId){
          nockDone();
          check(done, function(){
            assert.isDefined(personId);
          });
        });
      });
    });
    
    it('head', function(done){
      nockBack('headPerson.json', function(nockDone){
        client.head('/platform/tree/persons/L5C2-WYC', function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isUndefined(response.data);
          });
        });
      });
    });
    
    it('delete', function(done){
      nockBack('deletePerson.json', function(nockDone){
        createPerson(client, function(personId){
          client.delete('/platform/tree/persons/' + personId, function(error, response){
            nockDone();
            check(done, function(){
              assert.isDefined(response);
              assert.equal(response.statusCode, 204);
              assert.isUndefined(response.data);
            });
          });
        });
      });
    });
    
    it('redirect', function(done){
      nockBack('redirect.json', function(nockDone){
        client.get('/platform/tree/current-person', {
          followRedirect: true
        }, function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isArray(response.data.persons);
            assert(response.redirected);
            assert.isDefined(response.originalUrl);
            assert.isDefined(response.effectiveUrl);
            assert(response.originalUrl !== response.effectiveUrl);
          });
        });
      });
    });
    
    it('throttled', function(done){
      this.timeout(1800000);
      nockBack('throttled.json', function(nockDone){
        client.get('/platform/throttled?processingTime=1800000', function(error, response){
          client.get('/platform/throttled', function(error, response){
            nockDone();
            check(done, function(){
              assert.isDefined(response);
              assert.equal(response.statusCode, 200);
              assert(response.throttled, 'Response not throttled');
              assert.equal(response.retries, 1);
            });
          });
        });
      });
    });
    
  });
  
  describe('request middleware', function(){
    
    it('returns an error', function(done){
      authenticatedClient(function(client){
        client.addRequestMiddleware(function(client, request, next){
          next(new Error());
        });
        client.get('/anything', function(error, response){
          check(done, function(){
            assert.isDefined(error);
            assert.isUndefined(response);
          });
        });
      });
    });
    
    it('returns a new response', function(done){
      authenticatedClient(function(client){
        client.addRequestMiddleware(function(client, request, next){
          next(null, {
            statusCode: 200,
            statusText: 'OK',
            headers: {},
            originalUrl: '/url',
            effectiveUrl: '/url',
            redirected: false,
            requestMethod: 'GET',
            requestHeaders: {},
            retries: 0,
            throttled: false
          });
        });
        client.get('/anything', function(error, response){
          check(done, function(){
            assert.isUndefined(error);
            assert.isDefined(response);
          });
        });
      });
    });
    
  });
  
  describe('response middleware', function(){
    
    var client;
    
    before(function(done){
      authenticatedClient(function(c){
        c.addResponseMiddleware(gedcomxMiddleware);
        client = c;
        done();
      });
    });
    
    it('returns an error', function(done){
      authenticatedClient(function(client){
        // Add request middleware to simulate a response and skip any real HTTP execution
        client.addRequestMiddleware(function(client, request, next){
          next(null, {
            statusCode: 200,
            statusText: 'OK',
            headers: {},
            originalUrl: '/url',
            effectiveUrl: '/url',
            redirected: false,
            requestMethod: 'GET',
            requestHeaders: {},
            retries: 0,
            throttled: false
          });
        });
        client.addResponseMiddleware(function(client, request, response, next){
          next(new Error());
        });
        client.get('/anything', function(error, response){
          check(done, function(){
            assert.isDefined(error);
            assert.isUndefined(response);
          });
        });
      });
    });
    
    it('oauth response', function(done){
      nockBack('oauthPassword.json', function(nockDone){
        client.oauthPassword(sandbox.username, sandbox.password, function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isDefined(response.data.token);
            assert.isDefined(response.gedcomx);
            assert.isDefined(response.gedcomx.getAccessToken());
          });
        });
      });
    });
    
    it('gedcomx response', function(done){
      nockBack('getPerson.json', function(nockDone){
        createPerson(client, function(personId){
          client.get('/platform/tree/persons/' + personId, function(error, response){
            nockDone();
            check(done, function(){
              assert.isDefined(response);
              assert.equal(response.statusCode, 200);
              assert.isDefined(response.data);
              assert.isDefined(response.data.persons);
              assert.isDefined(response.gedcomx);
              assert.equal(response.gedcomx.getPersons().length, 1);
            });
          });
        });
      });
    });
    
    it('atom response', function(done){
      nockBack('getChanges.json', function(nockDone){
        createPerson(client, function(personId){
          client.get('/platform/tree/persons/' + personId + '/changes', {
            headers: {
              Accept: 'application/x-gedcomx-atom+json'
            }
          }, function(error, response){
            nockDone();
            check(done, function(){
              assert.isDefined(response);
              assert.equal(response.statusCode, 200);
              assert.isDefined(response.data);
              assert.isDefined(response.data.entries);
              assert.isDefined(response.gedcomx);
              assert(response.gedcomx.getEntries().length >= 1);
            });
          });
        });
      });
    });
    
    it('errors response', function(done){
      nockBack('errors.json', function(nockDone){
        client.get('/platform/tree/persons/PPPPPP', function(error, response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 404);
            assert.isDefined(response.gedcomx);
            assert.equal(response.gedcomx.getErrors().length, 1);
          });
        });
      });
    });
    
  });
  
  describe('pending modifications', function(){
    
    it('headers are added to the request', function(done){
      authenticatedClient({
        pendingModifications: ['mod1','mod2']
      }, function(client){
        client.addRequestMiddleware(function(client, request, next){
          assert.equal(request.headers['X-FS-Feature-Tag'], 'mod1,mod2');
          done();
          next(true);
        });
        client.get('/foo', function(){});
      });
    });
    
  });
  
  describe('requestInterval', function(){
    
    it('request interval is enforced', function(done){
      // Here we test that requests are propertly enqueued and the timing
      // between them is enforced when the requestInterval param is present.
      var interval = 1500,
          numRequests = 3,
          timings = [],
          client = apiClient({
            requestInterval: interval
          });
      this.timeout(interval * numRequests * 2);
      client.addRequestMiddleware(function(client, request, next){
        // This middleware is added after the requestInterval middleware so we
        // know that it's called after the requestInterval limit has been enforced.
        timings[request.options.num] = Date.now();
        if(timings.length === numRequests) {
          done(verifyTimings());
        }
        next();
      });
      for(var i = 0; i < numRequests; i++) {
        client.get('/foo', {
          num: i
        }, function(){});
      }
      
      // Make sure each subsequent request was at least {interval} ms after the 
      // previous request. Our timing is marked on a different tick in this test
      // than it is in the middleware and that can account for many ms of
      // difference so we allow a shortcoming of 30 ms below.
      function verifyTimings() {
        var diff;
        for(var i = 1; i < numRequests; i++) {
          diff = timings[i] - timings[i-1];
          if(diff < interval - 30) {
            console.log(timings);
            return new Error(`Request ${i+1} was only ${diff}ms after the request before it; expected ${interval}ms.`);
          }
        }
      }
    });
    
  });
  
});

/**
 * Create an API client
 * 
 * @param {Object} options
 * @return {FamilySearch} client
 */
function apiClient(options){
  var defaults = {
    appKey: sandbox.appkey,
    redirectUri: 'http://foobaz.com/oauth-redirect'
  };
  if(options){
    for(var o in options){
      defaults[o] = options[o];
    }
  }
  return new FamilySearch(defaults);
}

/**
 * Create an authenticate an API client
 * 
 * @param {Function} callback function(client)
 */
function authenticatedClient(options, callback){
  if(typeof options === 'function'){
    callback = options;
    options = null;
  }
  nockBack('oauthPassword.json', function(nockDone){
    var client = apiClient(options);
    client.oauthPassword(sandbox.username, sandbox.password, function(error, response){
      nockDone();
      callback(client);
    });
  });
}

/**
 * Middleware that uses gedcomx-js for deserialization into objects
 */
function gedcomxMiddleware(client, request, response, next){
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
}