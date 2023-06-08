/**
 * Triton RunSpot 4 helper
 */

var LocationHelper = require("sdk/base/util/LocationHelper");
var PROTOCOL = LocationHelper.getProtocol();

define(["dojo/_base/declare"], function (declare) {
  var tritonRunSpot4Helper = declare([], {
    ENDPOINT:
      PROTOCOL +
      "//runspot4.tritondigital.com/RunSpotV4.svc/GetVASTAd?&StationID={sid}&MediaFormat={mediaformat}&RecordImpressionOnCall={recordimpressiononcall}&AdMinimumDuration={adminimumduration}&AdMaximumDuration={admaximumduration}&AdLevelPlacement={adlevelplacement}&AdCategory={adcategory}",

    mediaAdBlankFiles: ["blank.flv", "9483.mp3"],

    getVastUri: function (
      apiBaseUrl,
      sid,
      mediaformat,
      adlevelplacement,
      recordimpressiononcall,
      adminimumduration,
      admaximumduration,
      adcategory
    ) {
      var mediaformat = mediaformat != undefined ? mediaformat : "21";
      var adlevelplacement =
        adlevelplacement != undefined ? adlevelplacement : "1";
      var recordimpressiononcall =
        recordimpressiononcall != undefined ? recordimpressiononcall : false;
      var adminimumduration =
        adminimumduration != undefined ? adminimumduration : "0";
      var admaximumduration =
        admaximumduration != undefined ? admaximumduration : "900";
      var adcategory = adcategory != undefined ? adcategory : "1";

      var requestUri = apiBaseUrl != undefined ? apiBaseUrl : this.ENDPOINT;
      requestUri = requestUri.replace("{sid}", sid);
      requestUri = requestUri.replace("{mediaformat}", parseInt(mediaformat));
      requestUri = requestUri.replace(
        "{adlevelplacement}",
        parseInt(adlevelplacement)
      );
      requestUri = requestUri.replace(
        "{recordimpressiononcall}",
        recordimpressiononcall
      );
      requestUri = requestUri.replace(
        "{adminimumduration}",
        parseInt(adminimumduration)
      );
      requestUri = requestUri.replace(
        "{admaximumduration}",
        parseInt(admaximumduration)
      );
      requestUri = requestUri.replace("{adcategory}", parseInt(adcategory));

      return requestUri;
    },
  });

  return tritonRunSpot4Helper;
});
