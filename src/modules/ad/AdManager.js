/**
 * Ad Manager
 *
 * @desc
 * <h5>Events fired:</h5><br>
 * module-ready<br>
 * module-error<br>
 * ad-playback-start<br>
 * ad-playback-complete<br>
 * ad-playback-error<br>
 * ad-countdown<br>
 * ad-quartile<br>
 * vast-companions-ready<br>
 * vast-companions-vpaid<br>
 * ad-blocker-detected<br>
 */
var MediaElement = require('sdk/base/util/MediaElement');

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'require',
  'dojo/_base/Deferred',
  'dojo/on',
  'dojo/dom-construct',
  'dojo/dom',
  'sdk/base/ad/AdServerType',
  'sdk/base/ad/TritonAdPlatformHelper',
  'sdk/base/util/XhrProvider',
  'sdk/modules/ad/ImaSdkModule',
  'sdk/modules/ad/VASTAdModule',
  'sdk/modules/ad/MediaAdModule',
  'sdk/base/util/analytics/GAEventRequest'
], function (declare, lang, require, Deferred, on, domConstruct, dom, AdServerType, TritonAdPlatformHelper, XhrProvider, ImaSdkModule, VASTAdModule, MediaAdModule, GAEventRequest) {
  var adManager = declare([], {
    // External Events
    AD_PLAYBACK_START: 'ad-playback-start',
    AD_PLAYBACK_COMPLETE: 'ad-playback-complete',
    AD_PLAYBACK_DESTROY: 'ad-playback-destroy',
    AD_PLAYBACK_ERROR: 'ad-playback-error',
    AD_COUNTDOWN: 'ad-countdown',
    AD_QUARTILE: 'ad-quartile',
    VAST_COMPANIONS_READY: 'vast-companions-ready',
    VAST_COMPANIONS_VPAID: 'vast-companions-vpaid',
    AD_BLOCKER_DETECTED: 'ad-blocker-detected',
    STREAMING_GUIDE_VERSION: '1.5.1',

    /**
     * constructor
     * @param tech
     * @param techType
     * @param target
     * @param config
     */
    constructor: function (tech, techType, target, config) {
      console.log('adManager::constructor');

      this.target = target;
      this.config = config;

      this.playerNode = dom.byId(this.config.playerId, document);
      this.tech = tech;
      this.techType = techType;
      this.adServerType = null;

      this.adModules = [];
      this.currentAdModule = null;
      this.xhrProv = new XhrProvider();

      if (!config.adBlockerDetected) {
        this.imaSdkModule = new ImaSdkModule(target, config);
        this.VASTAdModule = new VASTAdModule(target, config);
        this.mediaAdModule = new MediaAdModule(target, config);
      }

      this.inherited(arguments);

      //analytics
      this._adPrerollTime = 0;
      this._adPrerollTimeIntervall = null;
      this._adParser = null;
      this._adSource = null;
      this._adFormat = null;

      on(this.target, 'ad-playback-start', lang.hitch(this, this._onAdPlaybackStart));
      on(this.target, 'ad-playback-error', lang.hitch(this, this._onAdPlaybackError));
    },

    /**
     * playAd
     * @param adServerType
     * @param config
     */
    playAd: function (adServerType, config) {
      var self = this;

      this.adServerType = adServerType;
      // Audionode initialization on preroll only
      if (config.adBreak !== true) {
        MediaElement.init();
      }

      if (this.config.adBlockerDetected) {
        if (config.adBreak != true) {
          this.target.emit(this.AD_BLOCKER_DETECTED, {
            data: {
              message: 'playAd function has been disabled because Ad Blocker is activated'
            }
          });
        }
        return;
      }
      //start analytics timer
      self._adPrerollTime = 0;
      this._adPrerollTimeIntervall = setInterval(function () {
        self._adPrerollTime += 10;
      }, 10);

      //clean up old ad
      this.destroyAd(false);

      if (adServerType == AdServerType.TRITON_AD_PLATFORM) {
        adServerType = AdServerType.VAST_AD;
        config = this._convertTAPConfigToVast(config);
      }

      if (config.url) {
        config.url = this._generateUrl(config); //add tracking query parameters (geographic data, banners capabilities, technology, ...)
      }

      if (config.url == null && config.mediaUrl == undefined && config.rawXML == undefined && config.sid == undefined) {
        this.target.emit(this.AD_PLAYBACK_ERROR, {
          data: { type: null, error: true }
        });
        return;
      }

      //DAAST || Ando lookup
      if (config.url) {
        config.fallbackToVastPlugin = config.url.toLowerCase().indexOf('daast') > -1 || config.url.toLowerCase().indexOf('/ondemand/ars') > -1 || config.url.toLowerCase().indexOf('s3') > -1;
        this._adFormat = config.url.toLowerCase().indexOf('daast') > -1 ? 'DAAST' : 'VAST';
        this._adSource = config.url.toLowerCase().indexOf('daast') > -1 ? 'TAP' : config.sid ? 'CM3' : 'Others';
      } else if (config.rawXML) {
        config.fallbackToVastPlugin = config.rawXML.toLowerCase().indexOf('daast') > -1;
        this._adFormat = config.rawXML.toLowerCase().indexOf('daast') > -1 ? 'DAAST' : 'VAST';
        this._adSource = config.rawXML.toLowerCase().indexOf('daast') > -1 ? 'TAP' : config.sid ? 'CM3' : 'Others';
      }

      //create html5 media tag
      this.tech.prepare('adModule');

      switch (adServerType) {
        case AdServerType.VAST_AD:
          //Vast in ad break not supported by IMA because our ad break VAST XML files are not compliant VAST 2.0
          if (config.adBreak || config.fallbackToVastPlugin) {
            this._initAdModule(this.VASTAdModule, config);
            this._adParser = 'VASTModule';
          } else {
            this._initAdModule(this.imaSdkModule, config);
            this._adParser = 'IMA';
          }
          break;

        case AdServerType.MEDIA_AD:
          this._initAdModule(this.mediaAdModule, config);
          this._adParser = 'Direct';
          break;

        default:
          this.target.emit(this.AD_PLAYBACK_COMPLETE, {
            data: { type: null, error: false }
          });
          break;
      }
    },

    /**
     * skipAd
     */
    skipAd: function () {
      console.log('adManager::skipAd');

      if (this.techType == 'Flash') {
        this.tech.skipAd();
        return;
      }

      if (this.currentAdModule) {
        this.currentAdModule.skipAd();
      }
    },

    /**
     * destroyAd
     */
    destroyAd: function (shouldRemoveAdsRef) {
      console.log('adManager::destroyAd');

      if (this.techType == 'Flash') {
        this.tech.destroyAd(shouldRemoveAdsRef);
        return;
      }

      if (this.currentAdModule) {
        this.currentAdModule.destroyAd(shouldRemoveAdsRef);
      }
    },

    reloadSyncBanner: function () {
      if (this.techType == 'Flash') {
        this.tech.reloadSyncBanner();
        return;
      }

      if (this.currentAdModule) {
        if (this.adServerType == AdServerType.VAST_AD || this.adServerType == AdServerType.TRITON_AD_PLATFORM) {
          this.currentAdModule.reloadSyncBanner();
        }
      }
    },

    /**
     * _initAdModule
     * @param module
     * @param adConfig
     * @private
     */
    _initAdModule: function (module, adConfig) {
      console.log('adManager::_initAdModule');

      this._removeListeners();

      this.currentAdModule = module;

      //init events
      this._mediaAdReadyHandler = on(this.target, this.currentAdModule.AD_MODULE_MEDIA_READY, lang.hitch(this, this._onMediaAdReady));
      this._mediaAdEmptyHandler = on(this.target, this.currentAdModule.AD_MODULE_MEDIA_EMPTY, lang.hitch(this, this._onMediaAdEmpty));
      this._adCountdownHandler = on(this.target, this.currentAdModule.AD_MODULE_COUNTDOWN, lang.hitch(this, this._onAdModuleCountdown));
      this._adModulePlaybackStartHandler = on(this.target, this.currentAdModule.AD_MODULE_PLAYBACK_START, lang.hitch(this, this._onAdModulePlaybackStart));
      this._adModulePlaybackCompleteHandler = on(this.target, this.currentAdModule.AD_MODULE_PLAYBACK_COMPLETE, lang.hitch(this, this._onAdModulePlaybackComplete));
      this._adModulePlaybackDestroyHandler = on(this.target, this.currentAdModule.AD_MODULE_PLAYBACK_DESTROY, lang.hitch(this, this._onAdModulePlaybackDestroy));
      this._adModulePlaybackErrorHandler = on(this.target, this.currentAdModule.AD_MODULE_PLAYBACK_ERROR, lang.hitch(this, this._onAdModulePlaybackError));
      this._adModuleQuartileHandler = on(this.target, this.currentAdModule.AD_MODULE_QUARTILE, lang.hitch(this, this._onAdModuleQuartile));
      this._adModuleCompanionsHandler = on(this.target, this.currentAdModule.AD_MODULE_COMPANIONS, lang.hitch(this, this._onAdModuleCompanions));
      this._adModuleClickTrackingHandler = on(this.target, this.currentAdModule.AD_MODULE_CLICK_TRACKING, lang.hitch(this, this._onAdModuleClickTracking));
      this._adModuleVastEmptyHandler = on(this.target, this.currentAdModule.AD_MODULE_VAST_EMPTY, lang.hitch(this, this._onAdError));
      this._adModuleVastErrorHandler = on(this.target, this.currentAdModule.AD_MODULE_VAST_ERROR, lang.hitch(this, this._onAdError));

      this.currentAdModule.init(adConfig);

      //IMPORTANT : initAdListeners has to be called after the currentAdModule is initialized
      this.currentAdModule.initAdListeners(this.tech.html5OnDemand);
    },

    /**
     * _onAdPlaybackStart
     * @param e | event
     */
    _onAdPlaybackStart: function (e) {
      console.log('adManager::_onAdPlaybackStart');
      //send analytics preroll success
      //stop timer
      var gaDimensions = {};
      gaDimensions[GAEventRequest.DIM_AD_SOURCE] = this._adSource;
      gaDimensions[GAEventRequest.DIM_AD_FORMAT] = this._adFormat;
      gaDimensions[GAEventRequest.DIM_AD_PARSER] = this._adParser ? this._adParser : e.data && e.data.playerData && e.data.playerData.adParser ? e.data.playerData.adParser : '';

      var gaMetrics = {};
      gaMetrics[GAEventRequest.METRIC_CONNECTION_TIME] = this._adPrerollTime;

      GAEventRequest.requestGA(GAEventRequest.CATEGORY_AD, GAEventRequest.ACTION_PREROLL, GAEventRequest.LABEL_SUCCESS, gaDimensions, gaMetrics);

      clearInterval(this._adPrerollTimeIntervall);
    },

    /**
     * _onAdPlaybackError
     */
    _onAdPlaybackError: function (e) {
      console.log('adManager::_onAdPlaybackStart');
      //send analytics preroll success
      //stop timer
      var gaDimensions = {};
      gaDimensions[GAEventRequest.DIM_AD_SOURCE] = this._adSource;
      gaDimensions[GAEventRequest.DIM_AD_FORMAT] = this._adFormat;
      gaDimensions[GAEventRequest.DIM_AD_PARSER] = this._adParser ? this._adParser : e.data && e.data.playerData && e.data.playerData.adParser ? e.data.playerData.adParser : '';

      var gaMetrics = {};
      gaMetrics[GAEventRequest.METRIC_CONNECTION_TIME] = this._adPrerollTime;

      GAEventRequest.requestGA(GAEventRequest.CATEGORY_AD, GAEventRequest.ACTION_PREROLL, GAEventRequest.LABEL_ERROR, gaDimensions, gaMetrics);

      clearInterval(this._adPrerollTimeIntervall);
    },

    /**
     * _onAdModuleCompanions
     * @param e
     * @private
     */
    _onAdModuleCompanions: function (e) {
      console.log('adManager::_onAdModuleCompanions');

      this.currentAdModule.emit(this.VAST_COMPANIONS_READY, e.data);
    },

    /**
     * _onAdModulePlaybackStart
     * @param e
     * @private
     */
    _onAdModulePlaybackStart: function (e) {
      console.log('adManager::_onAdModulePlaybackStart');

      this._callImpressions();

      this.currentAdModule.emit(this.AD_PLAYBACK_START, { type: e.data.type });
    },

    /**
     * _onAdModulePlaybackComplete
     * @param e
     * @private
     */
    _onAdModulePlaybackComplete: function (e) {
      console.log('adManager::_onAdModulePlaybackComplete');

      this._removeListeners();

      this.currentAdModule.emit(this.AD_PLAYBACK_COMPLETE, {
        type: e.data.type
      });
    },

    /**
     * _onAdModulePlaybackDestroy
     * @param e
     * @private
     */
    _onAdModulePlaybackDestroy: function (e) {
      console.log('adManager::_onAdModulePlaybackDestroy');

      this._removeListeners();

      this.currentAdModule.emit(this.AD_PLAYBACK_DESTROY);
    },

    /**
     * _onAdModulePlaybackError
     * @param e
     * @private
     */
    _onAdModulePlaybackError: function (e) {
      console.log('adManager::_onAdModulePlaybackError');

      this._removeListeners();

      this.currentAdModule.emit(this.AD_PLAYBACK_ERROR, { type: e.data.type });
    },

    /**
     * _onAdModuleCountdown
     * @param e
     * @private
     */
    _onAdModuleCountdown: function (e) {
      console.log('adManager::_onAdModuleCountdown');
      console.log(e);

      this.currentAdModule.emit(this.AD_COUNTDOWN, {
        countDown: e.data.countDown
      });
    },

    /**
     * _onAdModuleClickTracking
     * @param e
     * @private
     */
    _onAdModuleClickTracking: function (e) {
      console.log('adManager::_onAdModuleClickTracking');

      if (e == null || e.data == undefined) return;

      var clickThrough = e.data.clickThrough != undefined ? e.data.clickThrough : null;
      var clickTrackings = e.data.clickTrackings != undefined ? e.data.clickTrackings : null;

      var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      var isWebUrl = pattern.test(clickThrough);

      if (clickThrough != null && isWebUrl == true) window.open(clickThrough);

      if (clickTrackings) {
        var clickTrackingsLength = clickTrackings.length;

        for (var i = 0; i < clickTrackingsLength; i++) {
          this.xhrProv.request(clickTrackings[i], null, {
            method: 'GET',
            handleAs: 'text',
            headers: {
              'X-Requested-With': null,
              'Content-Type': 'text/plain; charset=utf-8'
            }
          });
        }
      }
    },

    /**
     * _onAdModuleQuartile
     * @param e
     * @private
     */
    _onAdModuleQuartile: function (e) {
      console.log('adManager::_onAdModuleQuartile');

      if (this.currentAdModule.getVastInlineAd()) {
        var trackingEvents = this.currentAdModule.getVastInlineAd().getLinearTrackingEvents(this.currentAdModule._defaultSequence);

        var trackingEventsLength = trackingEvents.length;
        for (var i = 0; i < trackingEventsLength; i++) {
          if (trackingEvents[i].type == e.adQuartile) {
            var urls = trackingEvents[i].urls;
            var urlsLength = urls.length;
            for (var j = 0; j < urlsLength; j++) {
              this.xhrProv.request(urls[j], null, {
                method: 'GET',
                handleAs: 'text',
                headers: {
                  'X-Requested-With': null,
                  'Content-Type': 'text/plain; charset=utf-8'
                }
              });
            }
          }
        }
      }
    },

    /**
     * _onMediaAdReady
     * @param e
     * @private
     */
    _onMediaAdReady: function (e) {
      console.log('adManager::onMediaAdReady');

      var data = e.data;

      var mediaFile = this._getSupportedMediaFile(data);

      if (mediaFile != null) {
        this.tech.html5OnDemand.playAd({
          adServerType: data.adServerType,
          mediaUrl: mediaFile.url,
          mediaFormat: mediaFile.format,
          clickThrough: data.clickThrough,
          clickTrackings: data.clickTrackings
        });
      } else {
        this.target.emit(this.AD_PLAYBACK_ERROR, {
          data: { type: data.adServerType, error: false }
        });
      }
    },

    /**
     * _onMediaAdEmpty
     * @param e
     * @private
     */
    _onMediaAdEmpty: function (e) {
      console.log('adManager::onMediaAdEmpty');

      var data = e.data;

      this._removeListeners();

      this.currentAdModule.emit(this.AD_PLAYBACK_COMPLETE, {
        type: data.adServerType,
        error: false
      });
    },

    /**
     * _onAdError
     * @param e
     * @private
     */
    _onAdError: function (e) {
      console.log('adManager::onAdError');

      var data = e.data;

      this._removeListeners();

      this.currentAdModule.emit(this.AD_PLAYBACK_ERROR, {
        type: data.adServerType,
        error: false
      });
    },

    /**
     * _removeListeners
     * @private
     */
    _removeListeners: function () {
      console.log('adManager::_removeListeners');

      if (this._mediaAdReadyHandler) {
        this._mediaAdReadyHandler.remove();
      }
      if (this._mediaAdEmptyHandler) {
        this._mediaAdEmptyHandler.remove();
      }
      if (this._adCountdownHandler) {
        this._adCountdownHandler.remove();
      }
      if (this._adModulePlaybackStartHandler) {
        this._adModulePlaybackStartHandler.remove();
      }
      if (this._adModulePlaybackCompleteHandler) {
        this._adModulePlaybackCompleteHandler.remove();
      }
      if (this._adModulePlaybackErrorHandler) {
        this._adModulePlaybackErrorHandler.remove();
      }
      if (this._adModuleQuartileHandler) {
        this._adModuleQuartileHandler.remove();
      }
      if (this._adModuleClickTrackingHandler) {
        this._adModuleClickTrackingHandler.remove();
      }

      if (this._adModuleVastEmptyHandler) {
        this._adModuleVastEmptyHandler.remove();
      }

      if (this._adModuleVastErrorHandler) {
        this._adModuleVastErrorHandler.remove();
      }

      if (this._adModuleVastProcessCompleteHandler) {
        this._adModuleVastProcessCompleteHandler.remove();
      }

      if (this._adModuleCompanionsHandler) {
        this._adModuleCompanionsHandler.remove();
      }

      if (this._adModulePlaybackDestroyHandler) {
        this._adModulePlaybackDestroyHandler.remove();
      }
    },

    /**
     * _callImpressions
     * @private
     */
    _callImpressions: function () {
      console.log('adManager::_callImpressions');

      if (this.currentAdModule.getVastInlineAd()) {
        var impressions = this.currentAdModule.getVastInlineAd().impressions;

        console.log(impressions);

        if (impressions) {
          var impressionsLength = impressions.length;

          if (impressionsLength == 0) return;

          for (var i = 0; i < impressionsLength; i++) {
            this.xhrProv.request(impressions[i], null, {
              method: 'GET',
              handleAs: 'text',
              headers: {
                'X-Requested-With': null,
                'Content-Type': 'text/plain; charset=utf-8'
              }
            });
          }
        }
      }
    },

    /**
     * _getAdModuleById
     * @param Module
     * @param moduleId
     * @returns {*}
     * @private
     */
    _getAdModuleById: function (Module, moduleId) {
      var adModulesLength = this.adModules.length;

      if (adModulesLength == 0) {
        var newModule = new Module(this.target, this.config);
        this.adModules.push({ moduleId: moduleId, module: newModule });
        return newModule;
      }

      for (var i = 0; i < adModulesLength; i++) {
        if (this.adModules[i].moduleId == moduleId) return this.adModules[i].module;
      }

      var newModule = new Module(this.target, this.config);
      this.adModules.push({ moduleId: moduleId, module: newModule });
      return newModule;
    },

    /**
     * _getSupportedMediaFile
     * @param data
     * @returns {*}
     * @private
     */
    _getSupportedMediaFile: function (data) {
      if (data == null) return null;

      switch (data.adServerType) {
        case AdServerType.VAST_AD:
        case AdServerType.MEDIA_AD:
          if (data.mediaFiles == null || data.mediaFiles.length == 0) return null;

          var mediaFiles = data.mediaFiles;
          var mediaFilesLength = mediaFiles.length;

          for (var i = 0; i < mediaFilesLength; i++) {
            var j = this._isTypeSupported('video', 'video/mp4;');

            if ((mediaFiles[i].type == 'audio/aac' || mediaFiles[i].url.split('.').pop() == 'aac') && this._isTypeSupported('audio', 'audio/aac;')) return { url: mediaFiles[i].url, format: 'audio' };
            else if ((mediaFiles[i].type == 'audio/mp4' || mediaFiles[i].url.split('.').pop() == 'm4a') && this._isTypeSupported('audio', 'audio/mp4;'))
              return { url: mediaFiles[i].url, format: 'audio' };
            else if ((mediaFiles[i].type == 'audio/mpeg' || mediaFiles[i].url.split('.').pop() == 'mp3') && this._isTypeSupported('audio', 'audio/mpeg;'))
              return { url: mediaFiles[i].url, format: 'audio' };
            else if ((mediaFiles[i].type == 'audio/wav' || mediaFiles[i].url.split('.').pop() == 'wav') && this._isTypeSupported('audio', 'audio/wav;'))
              return { url: mediaFiles[i].url, format: 'audio' };
            else if ((mediaFiles[i].type == 'audio/ogg' || mediaFiles[i].url.split('.').pop() == 'oga' || mediaFiles[i].url.split('.').pop() == 'ogg') && this._isTypeSupported('audio', 'audio/ogg;'))
              return { url: mediaFiles[i].url, format: 'audio' };
            else if (mediaFiles[i].type == 'audio/webm' && this._isTypeSupported('audio', 'audio/webm;')) return { url: mediaFiles[i].url, format: 'audio' };
            else if (
              (mediaFiles[i].type == 'video/mp4' || mediaFiles[i].url.split('.').pop() == 'mp4' || mediaFiles[i].url.split('.').pop() == 'm4v') &&
              this._isTypeSupported('video', 'video/mp4;')
            ) {
              console.log({ url: mediaFiles[i].url, format: 'video' });
              return { url: mediaFiles[i].url, format: 'video' };
            } else if ((mediaFiles[i].type == 'video/ogg' || mediaFiles[i].url.split('.').pop() == 'ogv') && this._isTypeSupported('video', 'video/ogg;'))
              return { url: mediaFiles[i].url, format: 'video' };
            else if ((mediaFiles[i].type == 'video/webm' || mediaFiles[i].url.split('.').pop() == 'webm') && this._isTypeSupported('video', 'video/webm;'))
              return { url: mediaFiles[i].url, format: 'video' };
          }
          return null;
          break;
        default:
          return null;
          break;
      }
    },

    /**
     * _isTypeSupported
     * @param format
     * @param mimetype
     * @returns {boolean|string}
     * @private
     */
    _isTypeSupported: function (format, mimetype) {
      //var html5CheckerNode = domConstruct.create( format , { id: 'testAdHtml5Node' }, this.playerNode, 'first' );
      var html5CheckerNode = dom.byId('tdplayer_od_videonode', document);
      return !!html5CheckerNode.canPlayType && html5CheckerNode.canPlayType(mimetype);
    },

    /**
     * _convertTAPConfigToVast
     * @param adConfig
     * @returns {*}
     * @private
     */
    _convertTAPConfigToVast: function (adConfig) {
      var tritonAdPlatformHelper = new TritonAdPlatformHelper();

      adConfig.url = tritonAdPlatformHelper.getVastUri(adConfig);

      return adConfig;
    },

    /**
     * _generateUrl
     * @param adConfig
     * @returns {*}
     * @private
     */
    _generateUrl: function (adConfig) {
      if (adConfig != undefined && adConfig.url != undefined) {
        if (adConfig.url.indexOf('/ondemand/ars') > -1 && adConfig.trackingParameters != undefined) {
          var delimiter;

          /**
           * Add tdsdk
           */
          if (adConfig.trackingParameters.tdsdk != undefined) {
            delimiter = adConfig.url.indexOf('?') > -1 ? '&' : '?';
            adConfig.url += delimiter + 'tdsdk=' + adConfig.trackingParameters.tdsdk;
          }

          /**
           * Add geographic targeting query parameters to URL if position data exists in config object
           */
          if (
            adConfig.trackingParameters.position != undefined &&
            adConfig.trackingParameters.position.coords.latitude != undefined &&
            adConfig.trackingParameters.position.coords != undefined &&
            adConfig.trackingParameters.position.coords.longitude != undefined
          ) {
            delimiter = adConfig.url.indexOf('?') > -1 ? '&' : '?';
            adConfig.url +=
              delimiter +
              'lat=' +
              parseFloat(adConfig.trackingParameters.position.coords.latitude.toFixed(1)) +
              '&long=' +
              parseFloat(adConfig.trackingParameters.position.coords.longitude.toFixed(1));
          }

          /**
           * Add banners query parameters to URL
           */
          if (adConfig.trackingParameters.banners != undefined) {
            delimiter = adConfig.url.indexOf('?') > -1 ? '&' : '?';
            adConfig.url += delimiter + 'banners=' + adConfig.trackingParameters.banners;
          }

          //add custom trackingParameters
          var cloneTrackingParams = lang.clone(adConfig.trackingParameters);
          //removes non custom trackingParameters
          delete cloneTrackingParams['tdsdk'];
          delete cloneTrackingParams['position'];
          delete cloneTrackingParams['banners'];
          delete cloneTrackingParams['pname'];
          delete cloneTrackingParams['pversion'];

          for (var key in cloneTrackingParams) {
            delimiter = adConfig.url.indexOf('?') > -1 ? '&' : '?';
            adConfig.url += delimiter + key + '=' + encodeURIComponent(cloneTrackingParams[key]);
          }

          // Add streaming guide implementation version
          adConfig.url += delimiter + 'version=' + this.STREAMING_GUIDE_VERSION;

          return adConfig.url;
        } else {
          return adConfig.url;
        }
      } else {
        return undefined;
      }
    }
  });

  return adManager;
});
