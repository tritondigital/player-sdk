/**
 * VAST Companion Ad
 */
define(["dojo/_base/declare"], function (declare) {
  var vastCompanionAd = declare([], {
    constructor: function () {
      console.log("vastCompanionAd::constructor");

      this.id = null;
      this.width = null;
      this.height = null;
      this.expandedWidth = null;
      this.expandedHeight = null;
      this.resourceType = null;
      this.creativeType = null;
      this.url = null;
      this.code = null;
      this.clickThroughURL = null;
      this.altText = null;
      this.adParameters = null;
      this.creativeView = null;
    },
  });

  return vastCompanionAd;
});
