"use strict";

let path = require("path");
let webpack = require("webpack");
let baseConfig = require("./base");
let defaultSettings = require("./defaults");

// Add needed plugins here

let config = Object.assign({}, baseConfig, {
  entry: [
    `${defaultSettings.srcPath}/lib/swfobject-2.2`,
    `${defaultSettings.srcPath}/main`,
  ],
  output: {
    libraryTarget: "umd",
    path: path.resolve(__dirname, "../dist/"),
    publicPath: `.${defaultSettings.publicPath}`,
    filename: "td-sdk.min.js",
  },
  cache: true,
  devtool: "eval-source-map",
  plugins: [
    new webpack.ProvidePlugin({
      swfobject: "swfobject",
    }),
    //new webpack.optimize.DedupePlugin(),
    //   new webpack.optimize.UglifyJsPlugin( {
    //       compress: {
    //               warnings: false
    //        }
    //   } ),
    //   new webpack.optimize.OccurenceOrderPlugin(),
    //   new webpack.optimize.AggressiveMergingPlugin()
  ],
  resolve: {
    alias: {
      sdk: `${defaultSettings.srcPath}/`,
      dojo: `${defaultSettings.srcPath}/lib/dojo`,
      fixtures: path.resolve(__dirname, "../test/fixtures"),
    },
  },
  module: defaultSettings.getDefaultModules(),
});

// Add needed loaders to the defaults here
config.module.loaders
  .push
  //{ test : /\.js$/, loader: 'strip-loader?strip[]=console.log' }
  ();

config.module.preLoaders.push({
  test: /\.(js|jsx)$/,
  loader: "isparta-instrumenter-loader",
  include: [
    path.resolve(__dirname, "../src/base"),
    path.resolve(__dirname, "../src/modules"),
  ],
  //exclude:[ /node_modules/,/dojo/,/swfobject-2.2/, /EventSourceJS/]
});

module.exports = config;
