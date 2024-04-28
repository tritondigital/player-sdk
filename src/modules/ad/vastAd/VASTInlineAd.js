/**
 * VAST Inline Ad
 */
define(['dojo/_base/declare'], function (declare) {
  var vastInlineAd = declare([], {
    constructor: function () {
      console.log('VASTInlineAd::constructor');

      this.adTitle = null;
      this.adSystem = null;
      this.errorURL = null;
      this.description = null;
      this.impressions = [];

      /* DAAST */
      this.advertiser = null;
      this.expires = null;
      this.survey = null;
      this.category = null;
    },

    getLinearTrackingEvents: function (sequence) {
      return null;
    },

    addWrapperLinearTrackingEvents: function (array) {
      return;
    },

    addWrapperLinearVideoClickTracking: function (array) {
      return;
    },

    addImpressions: function (array) {
      return;
    },

    getCompanionAdUrl: function (width, height, vastResourceType, sequence) {
      return null;
    },

    /**
     * The collection of VASTCompanionAd within this ad package.
     */
    getCompanionAds: function (sequence) {
      return null;
    },

    getLinearMediaFiles: function (sequence) {
      return null;
    },

    getLinearMediaFileByIndex: function (index, sequence) {
      return null;
    },

    getLinearVideoClick: function (sequence) {
      return null;
    },

    /**
     * The collection of VASTNonLinearAd within this ad package.
     */
    getNonLinearAds: function (sequence) {
      return null;
    },

    getLinearDuration: function (sequence) {
      return null;
    }
  });

  return vastInlineAd;
});
