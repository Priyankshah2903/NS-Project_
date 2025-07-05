const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    process: require.resolve('process/browser.js'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
