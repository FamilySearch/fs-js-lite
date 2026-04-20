var nock = require('nock'),
    nockBack = nock.back;

// Configure nock back for recording and playback
nockBack.fixtures = __dirname + '/responses/';

// Set mode based on environment variable (for nock v14+)
// Modes: 'wild', 'dryrun', 'record', 'lockdown'
// Default to 'lockdown' if not specified
var mode = process.env.NOCK_BACK_MODE || 'lockdown';
nockBack.setMode(mode);

// Enable network connections for record mode (nock v14+)
if (mode === 'record' || mode === 'wild') {
  nock.enableNetConnect();
}

module.exports = nockBack;