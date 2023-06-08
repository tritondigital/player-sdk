/**
 * @module base/ErrorCode
 *
 * @desc
 * ErrorCode is the base class of all error code.
 */

var i18n = require("sdk/base/util/I18n");

define(["dojo/_base/declare"], function (declare) {
  var errorCode = declare([], {
    constructor: function () {
      console.log("errorCode::constructor");
      var e = i18n.getLocalization();
      this.flashModuleMap = {
        flashPluginOutOfDate: { code: 100, message: e["flashPluginOutOfDate"] },
      };

      this.html5ModuleMap = {
        browserNotSupported: { code: 101, message: e["browserNotSupported"] },
        tritonListenLink: { code: 102, message: e["tritonListenLink"] },
      };
    },
  });

  return errorCode;
});
