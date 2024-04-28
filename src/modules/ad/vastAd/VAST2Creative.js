/**
 * VAST 2 Creative
 */
define(['dojo/_base/declare'], function (declare) {
  var vast2Creative = declare([], {
    constructor: function () {
      console.log('vast2Creative::constructor');

      this.id = null;
      this.adID = null;
      this.sequence = null;
      this.linearElement = null; //VASTLinearElement
      this.companionAds = []; //Array of VASTCompanionAd
      this.nonLinearAds = []; //Array of VASTNonLinearAd
    }
  });

  return vast2Creative;
});
