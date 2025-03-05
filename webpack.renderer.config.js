const plugins = require('./webpack.plugins');
const rules = require('./webpack.rules');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins: [
    ...plugins.slice(0, -1),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      electron: false,
      net: false,
      tls: false,
      child_process: false,
      zlib: require.resolve('browserify-zlib'),
    },
    alias: {
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      'electron': require.resolve('./src/renderer/utils/electron-fix.ts'),
    },
  },
  externals: {
    electron: 'commonjs electron',
  },
}; 