/**
 * VASTWrapperAd
 */
define(['dojo/_base/declare'], function (declare) {
  var VASTWrapperAd = declare([], {
    constructor: function () {
      console.log('VASTWrapperAd::constructor');

      this.vastAdTagURL = null;
      this.impression = null; //deprecated
      this.impressions = [];
      this.error = null;
      this.trackingEvents = null; //Array
      this.creatives = []; //Array
      this.videoClicks = null;
    },

    getLinearTrackingEvents: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this._getLinearElement(sequence) != null ? this._getLinearElement(sequence).trackingEvents : this.trackingEvents;
    },

    _getLinearElement: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      var collectionLength = this.creatives.length;
      for (var i = 0; i < collectionLength; i++) {
        if (this.creatives[i].linearElement != null) {
          if (sequence == -1) return this.creatives[i].linearElement;
          else if (this.creatives[i].sequence == sequence) return this.creatives[i].linearElement;
        }
      }
    },

    getLinearVideoClick: function (sequence) {
      var sequence = sequence;
      if (sequence == undefined) {
        sequence = -1;
      }

      return this._getLinearElement(sequence) != null ? this._getLinearElement(sequence).videoClick : this.videoClicks;
    }
  });

  return VASTWrapperAd;
});
