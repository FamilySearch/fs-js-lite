var assert = require('chai').assert,
    jsdom = require('jsdom'),
    nockBack = require('./nockback'),
    sandbox = require('./sandbox'),
    createPerson = require('./createperson'),
    check = require('./check');

describe('browser', function(){
  
  var client;
  
  before(function(done){
    
    jsdom.env({
      html: '<div></div>',
      scripts: 'file://' + __dirname + '/../dist/FamilySearch.min.js',
      // Enable the virtual console to pipe the virtual window console
      // into the console of the current node instance. Helpful for debugging tests.
      // virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      done: function(error, window){
        if(error){
          console.error(error);
          done(error);
        }
        else {
          check(done, function(){
            assert.isDefined(window);
            assert.isDefined(window.FamilySearch);
            client = new window.FamilySearch({
              appKey: sandbox.appkey
            });
          });
        }
      }
    });
  });
  
  it('create and get person', function(done){
    this.timeout(10000);
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