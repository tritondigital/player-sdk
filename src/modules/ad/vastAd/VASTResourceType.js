/**
 * VAST Resource Type
 */
define(["dojo/_base/declare"], function (declare) {
  var vastResourceType = declare([], {
    IFRAME: "iframe", //URI source for an IFrame to display the companion element
    HTML: "html", //HTML to display the companion element
    STATIC: "static", //URI to a static file, such as an image or SWF file
    SCRIPT: "script",
    OTHER: "other",

    constructor: function (value) {
      console.log("vastResourceType::constructor");

      this.name = value;
    },
  });

  return vastResourceType;
});
