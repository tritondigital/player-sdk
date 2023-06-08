var _ = require("lodash");
window.lodash = _.noConflict();

/**
 * I18n
 */
var I18n = function () {
  if (typeof I18n.instance === "object") {
    return I18n.instance;
  }

  var locale = "en";
  var localeSupported = ["en", "fr", "pt", "es"];

  var scripts = document.getElementsByTagName("script");

  if (!_.isEmpty(scripts)) {
    var tdsdkLang = scripts[scripts.length - 1].getAttribute("tdsdk-lang");

    if (!_.isEmpty(tdsdkLang)) {
      locale = tdsdkLang;
    }
  }

  this.setLocalization = function (lang) {
    locale = lang;
  };

  this.getLocalization = function () {
    if (_.indexOf(localeSupported, locale) > -1) {
      return require("sdk/i18n/" + locale + ".json");
    } else {
      return require("sdk/i18n/en.json");
    }
  };

  I18n.instance = this;
};

module.exports = new I18n();
