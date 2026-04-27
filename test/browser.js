var assert = require('chai').assert,
    { JSDOM, VirtualConsole, CookieJar } = require('jsdom'),
    fs = require('fs'),
    path = require('path'),
    nockBack = require('./nockback'),
    sandbox = require('./sandbox'),
    createPerson = require('./createperson'),
    check = require('./check');

describe('browser', function(){
  
  it('load an access token from cookies', function(done){
    var cookieJar = new CookieJar();
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
    var cookieJar = new CookieJar();
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
  
  it('delete an access token cookie', function(done){
    var cookieJar = new CookieJar();
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
        client.deleteAccessToken();
        assert.equal(client.getAccessToken(), undefined);
        assert.equal(cookieJar.getCookieStringSync('http://test.testing/'), '');
      });
    });
  });
  
  it('load an access token with a cookie path', function(done){
    var cookieJar = new CookieJar();
    cookieJar.setCookieSync('FS_AUTH_TOKEN=loaded', 'http://test.testing/path');
    createClient({ 
      url: 'http://test.testing/path',
      cookieJar: cookieJar
    }, { 
      saveAccessToken: true,
      tokenCookiePath: '/path'
    }, function(error, client){
      if(error){ done(error); }
      check(done, function(){
        assert.equal(client.getAccessToken(), 'loaded');
      });
    });
  });
  
  it('delete an access token cookie with a cookie path', function(done){
    var cookieJar = new CookieJar();
    cookieJar.setCookieSync('FS_AUTH_TOKEN=loaded;path=/path', 'http://test.testing/path');
    createClient({ 
      url: 'http://test.testing/path',
      cookieJar: cookieJar
    }, { 
      saveAccessToken: true,
      tokenCookiePath: '/path'
    }, function(error, client){
      if(error){ done(error); }
      check(done, function(){
        assert.equal(client.getAccessToken(), 'loaded');
        client.deleteAccessToken();
        assert.equal(client.getAccessToken(), undefined);
        assert.equal(cookieJar.getCookieStringSync('http://test.testing/path'), '');
      });
    });
  });
  
  // Note: Full API integration tests are handled in test/node.js
  // These browser-specific tests focus on cookie handling and browser environment
  // API call tests have been removed since password grant no longer works
  // and re-recording fixtures would require valid OAuth credentials
  
});

/**
 * Setup the mock browser environment and return an SDK client object.
 *
 * @param {Object} envConfig set JSDOM options
 * @param {Object} clientConfig set SDK options
 * @param {Function} callback function(error, client)
 */
function createClient(envConfig, clientConfig, callback){
    clientConfig = Object.assign({
      appKey: sandbox.appkey
    }, clientConfig || {});

    const virtualConsole = new VirtualConsole();
    // Forward virtual console messages to the real console
    virtualConsole.on('error', (error) => console.error(error));
    virtualConsole.on('warn', (message) => console.warn(message));
    virtualConsole.on('log', (message) => console.log(message));

    // Read the built script file
    const scriptPath = path.join(__dirname, '..', 'dist', 'FamilySearch.min.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    const options = Object.assign({
      resources: 'usable',
      runScripts: 'dangerously',
      virtualConsole: virtualConsole
    }, envConfig || {});

    const dom = new JSDOM('<div></div>', options);
    const window = dom.window;
    const document = window.document;

    // Inject the script content directly
    const scriptElement = document.createElement('script');
    scriptElement.textContent = scriptContent;
    document.head.appendChild(scriptElement);

    // Call the callback after script is loaded
    try {
      callback(null, new window.FamilySearch(clientConfig));
    } catch (error) {
      callback(error);
    }
  }