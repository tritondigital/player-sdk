/**
 * VAST Tracking Event
 */
define(['dojo/_base/declare'], function (declare) {
  var vastTrackingEvent = declare([], {
    constructor: function () {
      console.log('vastTrackingEvent::constructor');

      this.urls = []; //Array of urls
      this.type = null;
    },

    addUrls: function (array) {
      var arrayLength = array.length;
      for (var i = 0; i < arrayLength; i++) {
        this.urls.push(array[i]);
      }
    }
  });

  return vastTrackingEvent;
});
