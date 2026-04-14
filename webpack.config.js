const path = require('path');

module.exports = (env, argv) => {
  const isMinified = argv.mode === 'production';

  return {
    entry: './src/FamilySearch.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isMinified ? 'FamilySearch.min.js' : 'FamilySearch.js',
      library: {
        name: 'FamilySearch',
        type: 'umd',
      },
      globalObject: 'this',
    },
    mode: argv.mode || 'production',
  };
};
