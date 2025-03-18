module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules\/.+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  // Specifik regel för SSH2 för att undvika omformatering
  {
    test: /node_modules\/ssh2\/.*\.js$/,
    use: 'null-loader',
  },
  // Regler för TypeScript/React
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true, // Skippa typkontroll för snabbare byggtid
      },
    },
  },
  // Regler för språkfiler
  {
    test: /\.json$/,
    type: 'javascript/auto',
    exclude: /(node_modules|\.webpack)/,
  },
  // Laddare för font-filer
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/i,
    type: 'asset/resource',
  },
]; 