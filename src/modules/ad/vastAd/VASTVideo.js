/**
 * VAST Video
 */
define(["dojo/_base/declare"], function (declare) {
  var vastVideo = declare([], {
    constructor: function () {
      console.log("vastVideo::constructor");

      this.duration = null;
      this.adID = null;
      this.videoClick = null; //VASTVideoClick
      this.mediaFiles = []; //Array of VASTMediaFile
    },
  });

  return vastVideo;
});
