const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('mjs');

config.resolver.alias = {
  ...(config.resolver.alias || {}),
  ws: require.resolve('isomorphic-ws/browser.js'),
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('crypto-browserify'),
  stream:  require.resolve('stream-browserify'),
  http:  require.resolve(__dirname, 'shims/empty.js'),
  https: require.resolve(__dirname, 'shims/empty.js'),
  net:   require.resolve(__dirname, 'shims/empty.js'),
  tls:   require.resolve(__dirname, 'shims/empty.js'),
  zlib:  require.resolve(__dirname, 'shims/empty.js'),
};

module.exports = config;
