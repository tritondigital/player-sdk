'use strict';

let path = require('path');
let webpack = require('webpack');
let baseConfig = require('./base');
let defaultSettings = require('./defaults');

// Add needed plugins here

let config = Object.assign({}, baseConfig, {
  entry: [
    'sdk/base/util/EventSourceJS',
    `${ defaultSettings.srcPath }/lib/swfobject-2.2`,
    `${ defaultSettings.srcPath }/main`
  ],
  output: {
      libraryTarget:'umd',
      path: path.resolve(__dirname, '../dist/'),
      publicPath: `.${ defaultSettings.publicPath }`,
      filename: "td-sdk.min.js"
  },
  cache: false,
  devtool: 'source-map',
  plugins: [
      new webpack.ProvidePlugin({
          swfobject: "swfobject"
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin( {
          compress: {
                  warnings: false
           }
      } ),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.AggressiveMergingPlugin()
  ],
  module: defaultSettings.getDefaultModules()
});

// Add needed loaders to the defaults here
config.module.loaders.push(
    { test : /\.js$/, loader: 'strip-loader?strip[]=console.log' }
);

module.exports = config;
