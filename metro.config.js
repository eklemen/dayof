const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

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
  http:  require.resolve(path.join(__dirname, 'shims/empty.js')),
  https: require.resolve(path.join(__dirname, 'shims/empty.js')),
  net:   require.resolve(path.join(__dirname, 'shims/empty.js')),
  tls:   require.resolve(path.join(__dirname, 'shims/empty.js')),
  zlib:  require.resolve(path.join(__dirname, 'shims/empty.js')),
  url:  require.resolve(path.join(__dirname, 'shims/empty.js')),
};

module.exports = withNativeWind(config, { input: './styles/global.css' });
