/**
 * @module MediaAd
 *
 * @desc
 * Media Ad module
 * media-ad-ready<br>
 * media-ad-empty<br>
 *
 */

define(['dojo/_base/declare', 'dojo/_base/lang', 'sdk/modules/ad/base/AdModule', 'sdk/base/ad/AdServerType'], function (declare, lang, adModule, AdServerType) {
  /**
   * @namespace tdapi/modules/mediaAd
   */
  var mediaAdModule = declare([adModule], {
    constructor: function (target, config) {
      console.log('mediaAdModule::constructor');

      this.target = target;
      this.config = config;
    },

    init: function (adConfig) {
      console.log('mediaAdModule::init - mediaUrl : ' + adConfig.mediaUrl + ' - linkUrl : ' + adConfig.linkUrl);

      this.inherited(arguments);

      if (adConfig.mediaUrl != undefined) this.playAdUrl(adConfig);
      else
        this.emit(this.AD_MODULE_MEDIA_EMPTY, {
          adServerType: AdServerType.MEDIA_AD
        });
    },

    playAdUrl: function (adConfig) {
      var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      var isWebUrl = pattern.test(adConfig.mediaUrl);

      if (isWebUrl == true) {
        var clickThrough = adConfig.linkUrl != undefined ? adConfig.linkUrl : null;

        this.emit(this.AD_MODULE_MEDIA_READY, {
          adServerType: AdServerType.MEDIA_AD,
          mediaFiles: [{ url: adConfig.mediaUrl }],
          clickThrough: clickThrough,
          clickTrackings: null
        });
      } else {
        this.emit(this.AD_MODULE_MEDIA_EMPTY, {
          adServerType: AdServerType.MEDIA_AD
        });
      }
    }
  });

  return mediaAdModule;
});
