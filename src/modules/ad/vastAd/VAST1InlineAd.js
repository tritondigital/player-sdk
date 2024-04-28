/**
 * VAST 1 Inline Ad
 */
define(['dojo/_base/declare'], function (declare) {
  var vast1InlineAd = declare([], {
    constructor: function () {
      console.log('vast1InlineAd::constructor');

      this.trackingEvents = []; //Array of VASTTrackingEvent
      this.companionAds = []; //Array of VASTCompanionAd
      this.nonLinearAds = []; //Array of VASTNonLinearAd
      this.video = null; //VASTVideo

      this.inherited(arguments);
    },

    addWrapperLinearTrackingEvents: function (value) {
      this.trackingEvents = this.trackingEvents.concat(value);
    },

    addWrapperLinearVideoClickTracking: function (value) {
      if (this.video == null) return;

      this.video.videoClick.clickTrackings = this.video.videoClick.clickTrackings.concat(value);
    },

    addImpression: function (value) {
      this.impressions.push(value);
    },

    addImpressions: function (value) {
      if (value != null) this.impressions = this.impressions.concat(value);
    },

    getLinearTrackingEvents: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.trackingEvents;
    },

    getCompanionAdUrl: function (width, height, vastResourceType, sequence) {
      var companionAds = this.getCompanionAds(sequence);

      if (companionAds == null) return null;

      var dimensionFit = false;
      var arrayLength = companionAds.length;
      for (var i = 0; i < arrayLength; i++) {
        dimensionFit = companionAds[i].width == width && companionAds[i].height == height;

        if (dimensionFit != true) {
          if (vastResourceType == null) return companionAds[i];
          else if (companionAds[i].resourceType == vastResourceType) return companionAds[i];
        }
      }

      return null;
    },

    getCompanionAds: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.companionAds;
    },

    getLinearMediaFiles: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.video.mediaFiles;
    },

    getLinearMediaFileByIndex: function (index, sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      var index = index;
      if (index == undefined) {
        index = 0;
      }

      return this.video != null && this.video.mediaFiles[index] != null ? this.video.mediaFiles[index] : null;
    },

    getLinearVideoClick: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.video.videoClick;
    },

    getNonLinearAds: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.nonLinearAds;
    },

    getLinearDuration: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this.video.duration;
    },

    addCompanionAd: function (companionAd) {
      this.companionAds.push(companionAd);
    },

    addNonLinearAd: function (nonLinearAd) {
      this.nonLinearAds.push(nonLinearAd);
    }
  });

  return vast1InlineAd;
});
