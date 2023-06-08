/**
 * Function that returns default values.
 * Used because Object.assign does a shallow instead of a deep copy.
 * Using [].push will add to the base array, so a require will alter
 * the base array output.
 */
"use strict";

const path = require("path");
const srcPath = path.resolve(__dirname, "../src");
const dfltPort = 4000;
/**
 * Get the default modules object for webpack
 * @return {Object}
 */
function getDefaultModules() {
  return {
    preLoaders: [
      //   {
      //     test: /\.(js|jsx)$/,
      //     include: srcPath,
      //     loader: 'eslint-loader'
      //   }
    ],
    loaders: [
      {
        test: /\.js$/,
        loaders: ["dojo-webpack-loader"],
        include: path.join(srcPath, "lib/dojo"),
      },
      {
        test: /\.json$/,
        loader: "json",
      },
      // {
      //     test: /(\.|\/)(js|jsx)$/,
      //     exclude: [ /node_modules/,/dojo/,/swfobject-2.2/, /EventSourceJS/],
      //     loader: 'babel'
      // }

      // {
      //     test: /(\.|\/)(js|jsx)$/,
      //     exclude: [ /node_modules/,/dojo/,/swfobject-2.2/, /EventSourceJS/],
      //     loader: 'babel',
      //     query: {
      //         cacheDirectory: false,
      //         presets: [ 'es2015' ]
      //     }
      // }
    ],
  };
}

module.exports = {
  srcPath: srcPath,
  publicPath: "/",
  port: dfltPort,
  getDefaultModules: getDefaultModules,
};
