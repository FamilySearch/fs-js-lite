var FamilySearch = require('../src/FamilySearch'),
    jsdom = require('jsdom').jsdom,
    assert = require('chai').assert,
    nock = require('nock'),
    nockBack = nock.back;

nockBack.fixtures = __dirname + '/responses/';
nockBack.setMode('record');

describe('FamilySearch', function(){
  
  var client;
  
  // Create a new FamilySearch client and a mock browser window
  before(function(done){
    client = new FamilySearch({
      appKey: 'a02j000000JBxOxAAL'
    });
    var document = jsdom(undefined, {
          url: 'https://sandbox.familysearch.org',
          strictSSL: false
        }),
        window = document.defaultView;
    global.XMLHttpRequest = window.XMLHttpRequest;
    done();
  });
  
  it('oauthPassword', function(done){
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
      client.get('/platform/tree/persons/L5C2-WYC', function(response){
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
  
  it('post');
  
  it('head');
  
  it('delete');
  
});

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