const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new webpack.IgnorePlugin({
    resourceRegExp: /^(fs|child_process|worker_threads|tls|net)$/,
  }),
  new HtmlWebpackPlugin({
    template: './src/renderer/index.html',
    filename: 'index.html',
    title: 'ScreammSSH Terminal',
    templateParameters: {
      scriptSrc: './main.js'
    }
  }),
]; 