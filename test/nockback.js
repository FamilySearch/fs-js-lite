var nock = require('nock'),
    nockBack = nock.back;
    
nockBack.fixtures = __dirname + '/responses/';

module.exports = nockBack;