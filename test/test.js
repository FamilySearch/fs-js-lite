var FamilySearch = require('../src/FamilySearch'),
    jsdom = require('jsdom').jsdom,
    assert = require('chai').assert;

describe('FamilySearch', function(){
  
  var fs;
  
  beforeEach(function(){
    fs = new FamilySearch({
      // appKey: 'a02j000000JBxOxAAL'
      appKey: 'a02j000000CBv4gAAD'
    });
    var document = jsdom(),
        window = document.defaultView;
    global.XMLHttpRequest = window.XMLHttpRequest;
  });
  
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
  
  it('get');
  
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