/**
 * @module Npe/Picture
 *
 * @desc
 * NPE Picture metadata<br>
 *
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "sdk/base/util/XhrProvider",
  "sdk/modules/npe/base/Inpe",
], function (declare, lang, XhrProvider, Inpe) {
  var picture = declare([Inpe], {
    constructor: function (data, platformId) {
      console.log("picture::constructor");

      this.pictureData = null;

      //A picture has an albumId or an artistId
      this.albumId = data.albumId ? data.albumId : null;
      this.artistId = data.artistId ? data.artistId : null;

      this.inherited(arguments);
    },

    getOriginalSourceUrl: function () {
      return this.data.originalSourceUrl;
    },

    getOriginalWidth: function () {
      return this.data.width;
    },

    getOriginalHeight: function () {
      return this.data.height;
    },

    /**
     * Returns the array of picture files
     *
     * @returns {Array.<Object>} containing: {width, height, url}
     */
    getFiles: function () {
      return this.pictureData != null &&
        this.pictureData.files != undefined &&
        this.pictureData.files.length > 0
        ? this.pictureData.files
        : null;
    },

    /**
     * Fetch data by requesting URL
     *
     */
    fetchData: function (isDynamicCall) {
      console.log("picture::fetchData - id:" + this.id);

      isDynamicCall = isDynamicCall == undefined ? false : isDynamicCall;

      if (isDynamicCall) {
        if (this.albumId != null)
          this.url = this.getDynamicAlbumPictureUrl(this.albumId, this.id);
        else this.url = this.getDynamicArtistPictureUrl(this.artistId, this.id);
      } else {
        if (this.albumId != null)
          this.url +=
            this.url.indexOf("?") != -1
              ? "&"
              : "?" + "rewrite_id=" + this.albumId;
        else
          this.url +=
            this.url.indexOf("?") != -1
              ? "&"
              : "?" + "rewrite_id=" + this.artistId;
      }

      if (this.alreadyFetched == false) {
        var xhrProv = new XhrProvider();
        xhrProv.request(
          this.url,
          { pictureId: this.id, isDynamicCall: isDynamicCall },
          this.getRequestArgs(),
          lang.hitch(this, this._onLoadComplete),
          lang.hitch(this, this._onLoadError)
        );
      } else {
        this.notify("picture-complete", { pictureId: this.id });
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
        this.notify("picture-error", { pictureId: requestData.pictureId });
      }
    },

    _onLoadComplete: function (requestData, data) {
      console.log(data);

      this.pictureData = data.picture;

      this.alreadyFetched = true;

      this.notify("picture-complete", { pictureId: requestData.pictureId });
    },
  });

  return picture;
});
