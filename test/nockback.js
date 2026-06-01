import nock from 'nock';

const nockBack = nock.back;

// Configure nock back for recording and playback
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

nockBack.fixtures = `${__dirname}/responses/`;

// Set mode based on environment variable (for nock v14+)
// Modes: 'wild', 'dryrun', 'record', 'lockdown'
// Default to 'lockdown' if not specified
const mode = process.env.NOCK_BACK_MODE || 'lockdown';
nockBack.setMode(mode);

// Enable network connections for record mode (nock v14+)
if (mode === 'record' || mode === 'wild') {
  nock.enableNetConnect();
}

export default nockBack;