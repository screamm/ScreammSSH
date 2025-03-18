const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new webpack.IgnorePlugin({
    resourceRegExp: /^(fs|child_process|worker_threads|tls|net)$/,
  }),
]; 