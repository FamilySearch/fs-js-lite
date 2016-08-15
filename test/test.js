var FamilySearch = require('../src/FamilySearch'),
    jsdom = require('jsdom').jsdom,
    assert = require('chai').assert,
    replay = require('replay');

replay.fixtures = __dirname + '/fixtures';

describe('FamilySearch', function(){
  
  var fs;
  
  beforeEach(function(done){
    fs = new FamilySearch({
      // appKey: 'a02j000000JBxOxAAL'
      appKey: 'a02j000000CBv4gAAD'
    });
    var document = jsdom(undefined, {
          strictSSL: false
        }),
        window = document.defaultView;
    global.XMLHttpRequest = window.XMLHttpRequest;
    fs.oauthPassword('sdktester', '1234sdkpass', function(response){
      console.log('response');
      if(response){
        done();
      } else {
        done(new Error('unable to authenticate'));
      }
    });
  });
  
  /*
  it('oauthPassword', function(done){
    fs.oauthPassword('sdktester', '1234sdkpass', function(response){
      check(done, function(){
        assert.isDefined(response);
        assert.equal(response.statusCode, 200);
        assert.isDefined(response.data);
        assert.isDefined(response.data.token);
      });
    });
  });
  */
  
  it('get', function(done){
    console.log('get');
    /*
      How will this be done? We have to mock api responses via nock. How will
      we handle authentication? How much effort will we put into verifying the
      correct format of the request?
    */
    /*
    fs.get('/platform/tree/persons/L5C2-WYC', function(response){
      check(done, function(){
        assert.isDefined(response);
        assert.equal(response.statusCode, 200);
        assert.isDefined(response.data);
        assert.isDefined(response.data.persons);
      });
    });
    */
    done();
  });
  
  /*
  it('post');
  
  it('head');
  
  it('delete');
  */
  
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