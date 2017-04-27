var assert = require('chai').assert,
    jsdom = require('jsdom'),
    nockBack = require('./nockback'),
    sandbox = require('./sandbox'),
    createPerson = require('./createperson'),
    check = require('./check');

describe('browser', function(){
  
  it('load an access token from cookies', function(done){
    var cookieJar = jsdom.createCookieJar();
    cookieJar.setCookieSync('FS_AUTH_TOKEN=loaded', 'http://test.testing/');
    createClient({ 
      url: 'http://test.testing',
      cookieJar: cookieJar
    }, { 
      saveAccessToken: true
    }, function(error, client){
      if(error){ done(error); }
      check(done, function(){
        assert.equal(client.getAccessToken(), 'loaded');
      });
    });
  });
  
  it('save an access token to the cookie', function(done){
    var cookieJar = jsdom.createCookieJar();
    createClient({ 
      url: 'http://test.testing',
      cookieJar: cookieJar
    }, null, function(error, client){
      if(error){ done(error); }
      check(done, function(){
        client.config({
          accessToken: 'loaded',
          saveAccessToken: true
        });
        assert.equal(cookieJar.getCookieStringSync('http://test.testing/'), 'FS_AUTH_TOKEN=loaded');
      });
    });
  });
  
  it('create and get person', function(done){
    this.timeout(10000);
    createClient(null, null, function(error, client){
      if(error){ done(error); }
      nockBack('browserOauthPassword.json', function(nockDone){
        client.oauthPassword(sandbox.username, sandbox.password, function(error, response){
          nockDone();
          check(function(error){
            if(error){
              done(error);
            }
          }, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isDefined(response.data.token);
            nockBack('browserGetPerson.json', function(nockDone){
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
        });
      });
    });
  });
  
  it('redirect', function(done){
    this.timeout(10000);
    createClient(null, null, function(error, client){
      if(error){ done(error); }
      nockBack('browserOauthPassword.json', function(nockDone){
        client.oauthPassword(sandbox.username, sandbox.password, function(error, response){
          nockDone();
          check(function(error){
            if(error){
              done(error);
            }
          }, function(){
            assert.isDefined(response);
            assert.equal(response.statusCode, 200);
            assert.isDefined(response.data);
            assert.isDefined(response.data.token);
            nockBack('browserRedirect.json', function(nockDone){
              createPerson(client, function(personId){
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
          });
        });
      });
    });
  });
  
});

/**
 * Setup the mock browser environment and return an SDK client object.
 * 
 * @param {Object} envConfig set jsdom.env() options
 * @param {Object} clientConfig set SDK options
 * @param {Function} callback function(error, client)
 */
function createClient(envConfig, clientConfig, callback){
    clientConfig = Object.assign({
      appKey: sandbox.appkey
    }, clientConfig || {});
    envConfig = Object.assign({
      html: '<div></div>',
      scripts: 'file://' + __dirname + '/../dist/FamilySearch.min.js',
      /* Enable the virtual console to pipe the virtual window console
         into the console of the current node instance. Helpful for debugging tests. */
      virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      done: function(error, window){
        if(error){
          console.error(error);
          callback(error);
        }
        else {
          callback(null, new window.FamilySearch(clientConfig));
        }
      }
    }, envConfig || {});
    jsdom.env(envConfig);
  }