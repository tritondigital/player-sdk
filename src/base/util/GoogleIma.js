var $script = require('scriptjs');

/**
 *
 * Google Ima
 *
 */
define(['dojo/_base/declare', 'require', 'dojo/_base/Deferred'], function (declare, require, Deferred) {
  var googleIma = declare([], {
    constructor: function () {
      console.log('googleIma::constructor');
    },

    init: function () {
      var imaURL = '//imasdk.googleapis.com/js/sdkloader/ima3.js';

      var def = new Deferred();

      $script(imaURL, function () {
        def.resolve();
      });

      return def;
    }
  });

  return googleIma;
});
