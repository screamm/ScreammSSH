const plugins = require('./webpack.plugins');
const rules = require('./webpack.rules');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'main.js'
  },
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
  
  // Explicit ange Node.js core-moduler som externa 
  externalsPresets: { 
    node: true // Detta gör alla inbyggda Node.js moduler till externa 
  },
  
  // Lista alla Node.js core-moduler som vi använder som externa
  externals: {
    'child_process': 'commonjs child_process',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
    'util': 'commonjs util',
    'crypto': 'commonjs crypto',
    'electron': 'commonjs electron',
    'ssh2': 'commonjs ssh2',
    'electron-store': 'commonjs electron-store'
  }
}; 