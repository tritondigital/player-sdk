/**
 * VAST Media File
 */
define(['dojo/_base/declare'], function (declare) {
  var vastMediaFile = declare([], {
    DELIVERY_STREAMING: 'streaming',
    DELIVERY_PROGRESSIVE: 'progressive',

    constructor: function () {
      console.log('vastMediaFile::constructor');

      this.url = null;
      this.id = null;
      this.delivery = null; //Method of delivery for the media file, usually "streaming" or "progressive"
      this.bitrate = null; //The bitrate of the encoded media file in kilobits per second
      this.width = null;
      this.height = null;
      this.type = null; //MIME type
      this.scalable = false;
      this.maintainAspectRatio = false;
      this.apiFramework = null;
      this.minBitrate = null;
      this.maxBitrate = null;
      this.codec = null;
    }
  });

  return vastMediaFile;
});
