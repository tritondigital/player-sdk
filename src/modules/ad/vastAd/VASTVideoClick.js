/**
 * VAST Video Click
 */
define(['dojo/_base/declare'], function (declare) {
  var vastVideoClick = declare([], {
    constructor: function () {
      console.log('vastVideoClick::constructor');

      this.clickThrough = null;
      this.clickTrackings = []; //Array
      this.customClicks = []; //Array
    }
  });

  return vastVideoClick;
});
