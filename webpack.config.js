import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (env, argv) => {
  const isMinified = argv.mode === 'production';

  return {
    entry: './src/FamilySearch.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isMinified ? 'FamilySearch.min.js' : 'FamilySearch.js',
      library: {
        name: 'FamilySearch',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
    },
    mode: argv.mode || 'production',
    resolve: {
      fallback: {
        // Don't include Node.js crypto module in browser builds
        // Our pkce.js uses window.crypto.subtle for browsers instead
        crypto: false
      }
    }
  };
};
