'use strict';
let path = require('path');
let defaultSettings = require('./defaults');
let additionalPaths = [];
module.exports = {
  additionalPaths: additionalPaths,
  port: defaultSettings.port,
  debug: true,
  devtool: 'eval',
  output: {
      libraryTarget:'umd',
      path: path.join(__dirname, 'dist'),
      publicPath: `.${ defaultSettings.publicPath }`,
      filename: "td-sdk.min.js"
  },
  resolve: {
    alias: {
        "sdk": defaultSettings.srcPath,
        "dojo": path.join(defaultSettings.srcPath, 'lib/dojo')
    }
  },
  module: {},
  dojoWebpackLoader: {
      // We should specify paths to core and dijit modules because we using both
      dojoCorePath: path.join(defaultSettings.srcPath, 'lib/dojo')
      // Languages for dojo/nls module which will be in result pack.
      //includeLanguages: ['en', 'fr']
  }

};
