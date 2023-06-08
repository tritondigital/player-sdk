/**
 * @module Npe/Track
 *
 * @desc
 * NPE Track metadata<br>
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "sdk/base/util/XhrProvider",
  "sdk/modules/npe/base/Inpe",
], function (declare, lang, XhrProvider, Inpe) {
  var track = declare([Inpe], {
    constructor: function (data, platformId) {
      console.log("track::constructor");

      this.trackData = null;

      this.inherited(arguments);
    },

    /**
     * URL for iTunes Buy Url
     *
     * @return {string} the url of iTunes JSON data
     */
    getBuyUrl: function () {
      if (this.trackData != null) return this.trackData.buyURL;
      else return this.data.buyURL;
    },

    getDuration: function () {
      return this.data.duration;
    },

    getSampleUrl: function () {
      if (this.trackData != null) return this.trackData.sampleURL;
      else return this.data.sampleURL;
    },

    getTitle: function () {
      if (this.trackData != null) return this.trackData.title;
      else return this.data.title;
    },

    getArtists: function () {
      return this.trackData.artists;
    },

    getReview: function () {
      return this.trackData.review;
    },

    getReviewAuthor: function () {
      return this.trackData.reviewAuthor;
    },

    getDisc: function () {
      return this.data.disc;
    },

    fetchData: function (isDynamicCall) {
      console.log("track::fetchData - id:" + this.id);

      isDynamicCall = isDynamicCall == undefined ? false : isDynamicCall;

      if (isDynamicCall) this.url = this.getDynamicTrackUrl(this.id);

      if (this.alreadyFetched == false) {
        var xhrProv = new XhrProvider();
        xhrProv.request(
          this.url,
          { trackId: this.id, isDynamicCall: isDynamicCall },
          this.getRequestArgs(),
          lang.hitch(this, this._onLoadComplete),
          lang.hitch(this, this._onLoadError)
        );
      } else {
        this.notify("track-complete", { trackId: this.id });
      }
    },

    /***************************************/
    /******* PRIVATE FUNCTIONS  ************/
    /***************************************/

    _onLoadError: function (requestData, error) {
      console.error(error);

      if (requestData.isDynamicCall == false) {
        this.fetchData(true); //Fallback to dynamic url
      } else {
        this.notify("track-error", { trackId: requestData.trackId });
      }
    },

    _onLoadComplete: function (requestData, data) {
      console.log(data);

      this.trackData = data.track;

      this.alreadyFetched = true;

      this.notify("track-complete", { trackId: requestData.trackId });
    },
  });

  return track;
});
