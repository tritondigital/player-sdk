'use strict';

let path = require('path');
let webpack = require('webpack');
let baseConfig = require('./base');
let defaultSettings = require('./defaults');
const MinifyPlugin = require('babel-minify-webpack-plugin');

// Add needed plugins here

let config = Object.assign({}, baseConfig, {
    entry: [`${defaultSettings.srcPath}/lib/swfobject-2.2`, `${defaultSettings.srcPath}/main`],
  output: {
      libraryTarget:'umd',
      path: path.resolve(__dirname, '../dist/'),
      publicPath: `.${ defaultSettings.publicPath }`,
        filename: 'td-sdk.min.js'
  },
  cache: false,
  devtool: 'source-map',
  plugins: [
      new webpack.ProvidePlugin({
            swfobject: 'swfobject'
      }),
      new webpack.optimize.DedupePlugin(),      
      new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new MinifyPlugin({propertyLiterals:false, removeConsole:true, builtIns:false},{comments:false})
  ],
  module: defaultSettings.getDefaultModules()
});

module.exports = config;
