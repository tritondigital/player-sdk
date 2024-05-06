/**
 * Triton Ad Platform helper
 */

var LocationHelper = require('sdk/base/util/LocationHelper');
var PROTOCOL = LocationHelper.getProtocol();

define(['dojo/_base/declare'], function (declare) {
  var tritonAdPlatformHelper = declare([], {
    ENDPOINT: PROTOCOL + '//{host}/ondemand/ars?type={type}',

    getVastUri: function (config) {
      if (config.host == undefined || config.type == undefined || (config.stationName == undefined && config.stationId == undefined)) return null;

      var requestUri = this.ENDPOINT;
      requestUri = requestUri.replace('{host}', config.host);
      requestUri = requestUri.replace('{type}', config.type);

      if (config.format != undefined) requestUri = requestUri + '&fmt=' + config.format;

      if (config.stationName != undefined) requestUri = requestUri + '&stn=' + config.stationName;
      else if (config.stationId != undefined) requestUri = requestUri + '&stid=' + parseInt(config.stationId);

      if (config.maxAds != undefined) requestUri = requestUri + '&Max_ads=' + parseInt(config.maxAds);

      if (config.assetType != undefined) requestUri = requestUri + '&at=' + config.assetType;

      if (config.minFileSize != undefined) requestUri = requestUri + '&minsz=' + parseInt(config.minFileSize);

      if (config.maxFileSize != undefined) requestUri = requestUri + '&maxsz=' + parseInt(config.maxFileSize);

      if (config.fileFormat != undefined) requestUri = requestUri + '&cntnr=' + config.fileFormat;

      if (config.minDuration != undefined) requestUri = requestUri + '&mindur=' + parseInt(config.minDuration);

      if (config.maxDuration != undefined) requestUri = requestUri + '&maxdur=' + parseInt(config.maxDuration);

      if (config.minBitrate != undefined) requestUri = requestUri + '&minbr=' + parseInt(config.minBitrate);

      if (config.maxBitrate != undefined) requestUri = requestUri + '&maxbr=' + parseInt(config.maxBitrate);

      if (config.minWidth != undefined) requestUri = requestUri + '&minw=' + parseInt(config.minWidth);

      if (config.maxWidth != undefined) requestUri = requestUri + '&maxw=' + parseInt(config.maxWidth);

      if (config.minHeight != undefined) requestUri = requestUri + '&minh=' + parseInt(config.minHeight);

      if (config.maxHeight != undefined) requestUri = requestUri + '&maxh=' + parseInt(config.maxHeight);

      if (config.audioCodec != undefined) requestUri = requestUri + '&acodec=' + config.audioCodec;

      if (config.audioMinChannels != undefined) requestUri = requestUri + '&minach=' + parseInt(config.audioMinChannels);

      if (config.audioMaxChannels != undefined) requestUri = requestUri + '&maxach=' + parseInt(config.audioMaxChannels);

      if (config.audioSampleRates != undefined) requestUri = requestUri + '&asr=' + config.audioSampleRates;

      if (config.videoCodec != undefined) requestUri = requestUri + '&vcodec=' + config.videoCodec;

      if (config.videoAspectRatio != undefined) requestUri = requestUri + '&vaspect=' + config.videoAspectRatio;

      if (config.minFrameRate != undefined) requestUri = requestUri + '&minfps=' + parseFloat(config.minFrameRate);

      if (config.maxFrameRate != undefined) requestUri = requestUri + '&maxfps=' + parseFloat(config.maxFrameRate);

      if (config.excludedCategories != undefined) requestUri = requestUri + '&iab-categories-to-exclude=' + config.excludedCategories;

      return requestUri;
    }
  });

  return tritonAdPlatformHelper;
});
