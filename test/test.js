var FamilySearch = require('../src/FamilySearch'),
    jsdom = require('jsdom').jsdom,
    assert = require('chai').assert,
    nock = require('nock'),
    nockBack = nock.back;

nockBack.fixtures = __dirname + '/responses/';

describe('FamilySearch', function(){
  
  describe('basic', function(){
  
    var client;
    
    // Create a new FamilySearch client and a mock browser window
    before(function(done){
      
      // Setup the mock window
      var document = jsdom(undefined, {
            url: 'https://integration.familysearch.org',
            strictSSL: false
          }),
          window = document.defaultView;
      global.XMLHttpRequest = window.XMLHttpRequest;
      global.window = window;
      global.document = window.document;
      
      // Setup the client
      client = new FamilySearch({
        appKey: 'a02j000000JBxOxAAL'
      });
      
      // Login
      nockBack('oauthPassword.json', function(nockDone){
        client.oauthPassword('sdktester', '1234sdkpass', function(response){
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
          client.get('/platform/tree/persons/' + personId, function(response){
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
        client.head('/platform/tree/persons/L5C2-WYC', function(response){
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
          client.delete('/platform/tree/persons/' + personId, function(response){
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
        client.get('/platform/tree/current-person', function(response){
          nockDone();
          check(done, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isArray(response.data.persons);
            assert(response.redirected);
            assert.isDefined(response.originalUrl);
            assert.isDefined(response.effectiveUrl);
          });
        });
      });
    });
    
    it('throttled', function(done){
      this.timeout(1800000);
      nockBack('throttled.json', function(nockDone){
        client.get('/platform/throttled?processingTime=1800000', function(response){
          client.get('/platform/throttled', function(response){
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
  
  describe('gedcomx middleware', function(){
    
    var gedcomx = require('gedcomx-js');
    require('gedcomx-fs-js')(gedcomx);
    
    var client;
    
    // Create a new FamilySearch client and a mock browser window
    before(function(done){
      
      // Setup the mock window
      var document = jsdom(undefined, {
            url: 'https://integration.familysearch.org',
            strictSSL: false
          }),
          window = document.defaultView;
      global.XMLHttpRequest = window.XMLHttpRequest;
      global.window = window;
      global.document = window.document;
      
      // Setup the client
      client = new FamilySearch({
        appKey: 'a02j000000JBxOxAAL',
        gedcomx: gedcomx
      });
      
      client.addResponseMiddleware(function(client, request, response, next){
        if(response.data){
          if(response.data.entries){
            response.gedcomx = gedcomx.AtomFeed(response.data);
          }
          else if(response.data.access_token){
            response.gedcomx = gedcomx.OAuth2(response.data);
          }
          else if(response.data.errors) {
            response.gedcomx = gedcomx.Errors(response.data);
          }
          else {
            response.gedcomx = gedcomx(response.data);
          }
        }
        next();
      });
      
      // Login
      nockBack('oauthPassword.json', function(nockDone){
        client.oauthPassword('sdktester', '1234sdkpass', function(response){
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
          client.get('/platform/tree/persons/' + personId, function(response){
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
          }, function(response){
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
        client.get('/platform/tree/persons/PPPPPP', function(response){
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
  
});

/**
 * Create a person.
 * 
 * @param {FamilySearch} client
 * @param {Function} callback - is given the new person's ID on success, nothing on error
 */
function createPerson(client, callback){
  client.post('/platform/tree/persons', {
    body: {
      "persons": [
        {
          "living": true,
          "gender": {
            "type": "http://gedcomx.org/Male"
          },
          "names": [
            {
              "type": "http://gedcomx.org/BirthName",
              "preferred": true,
              "nameForms": [
                {
                  "fullText": "Jacob",
                  "parts": [
                    {
                      "value": "Jacob",
                      "type": "http://gedcomx.org/Given"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }, function(response){
    if(response && response.statusCode === 201){
      callback(response.getHeader('X-entity-id'));
    } else {
      callback();
    }
  });
}

/**
 * Helper method that assists in managing exceptions during async tests
 * http://stackoverflow.com/a/15208067
 */
function check( done, f ) {
  try {
    f();
    done();
  } catch( e ) {
    done( e );
  }
}