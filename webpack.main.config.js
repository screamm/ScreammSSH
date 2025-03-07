const plugins = require('./webpack.plugins');
const rules = require('./webpack.rules');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  module: {
    rules,
  },
  plugins: [
    ...plugins.slice(0, -1), // Ta bort webpack från plugins
    // Definiera nödvändiga miljövariabler
    new webpack.DefinePlugin({
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  // Eftersom detta är för huvudprocessen behöver vi inte polyfills då
  // vi har tillgång till Node.js API:er
  target: 'electron-main',
  
  // Använd nodeExternals istället för manuell lista
  externals: [
    nodeExternals({
      // Tillåt inte bundling av dessa moduler
      allowlist: [
        // Du kan tillåta vissa moduler att bundlas om det behövs
      ],
    }),
  ],
  
  // Optimering för Node.js
  node: {
    __dirname: false,
    __filename: false,
  },
}; 