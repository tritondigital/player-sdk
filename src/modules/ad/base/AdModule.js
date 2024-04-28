/**
 * @module ad/base/AdModule
 *
 * @desc
 * The AdModule is the base class of all Ad modules in the SDK.
 */

define(['dojo/_base/declare', 'dojo/on', 'dojo/_base/lang', 'sdk/base/ad/AdQuartile', 'sdk/base/ad/AdModuleEvents'], function (declare, on, lang, adQuartile, adModuleEvents) {
  var adModule = declare([adModuleEvents], {
    /**
     * constructor
     * @param target
     * @param config
     */
    constructor: function (target, config) {
      console.log('adModule::constructor');

      this.target = target;
      this.config = config;
      this.adQuartile = new adQuartile();
      this._defaultSequence = -1;
      this._adsTrackingProgress = [];
      this._destroyAdToggle = false;
    },

    /**
     * init
     */
    init: function () {
      console.log('adModule::init');

      this._destroyAdlisteners();

      this.onAdPlaybackStatusListener = this.target.on('ad-playback-status', lang.hitch(this, this._onAdPlaybackStatus));

      this.inherited(arguments);
    },

    /**
     * destroyAd
     */
    destroyAd: function () {
      console.log('adModule::destroyAd');

      if (this.html5OnDemand) {
        if (typeof this.html5OnDemand.skip === 'function') {
          this._destroyAdToggle = true; //always before skip

          this.html5OnDemand.skip();
        }
        this.html5OnDemand = null;
      }
    },

    /**
     * skipAd
     */
    skipAd: function () {
      console.log('adModule::skipAd');

      if (this.html5OnDemand) {
        if (typeof this.html5OnDemand.skip === 'function') {
          this.html5OnDemand.skip();
        }

        this.html5OnDemand = null;
      }
    },

    /**
     * initAdListeners
     * @param html5OnDemand
     */
    initAdListeners: function (html5OnDemand) {
      console.log('adModule::initAdListeners');

      this.html5OnDemand = html5OnDemand;

      this.html5OnDemand.initHTMLElementsStyle(this.html5OnDemand.videoNode);

      this.playbackOnDemandStatushandler = this.html5OnDemand.setPlaybackStatusHandler(lang.hitch(this, this._onAdPlaybackStatus));
      this.clickTrackingElementClickedHandler = this.html5OnDemand.setClickTrackingElementClickedHandler(lang.hitch(this, this._onClickTrackingElementClicked));
      this.adPlaybackCompleteHandler = this.target.on('ad-playback-complete', lang.hitch(this, this._destroyAdlisteners));
      this.adPlaybackDestroyHandler = this.target.on('ad-playback-destroy', lang.hitch(this, this._destroyAdlisteners));
      this.adPlaybackErrorHandler = this.target.on('ad-playback-error', lang.hitch(this, this._destroyAdlisteners));
    },

    /**
     * getVastInlineAd
     * @returns {null}
     */
    getVastInlineAd: function () {
      console.log('adModule::getVastInlineAd');

      return null;
    },

    /**
     * _onAdPlaybackStatus
     * @param e
     * @private
     */
    _onAdPlaybackStatus: function (e) {
      console.log('adModule::_onAdPlaybackStatus');

      this.html5Node = e.html5Node;

      if (e.code == 'MEDIA_STARTED') {
        //This is fired when a stream is resumed as well that's why we check the currentTime.
        if (this.html5Node.currentTime <= 0.5) {
          this.emit(this.AD_MODULE_PLAYBACK_START, {
            id: this.playerNode,
            type: e.adServerType,
            error: false
          });
        }
      } else if (e.code == 'MEDIA_TIME_UPDATE') {
        var currentTime = Math.round(this.html5Node.currentTime);
        var duration = Math.round(this.html5Node.duration);

        this._checkVideoPlaybackQuartile(this._getTimePercent(currentTime, duration));

        this.emit(this.AD_MODULE_COUNTDOWN, {
          countDown: duration - currentTime
        });
      } else if (e.code == 'MEDIA_ENDED' || e.code == 'MEDIA_ERROR') {
        this.html5OnDemand.stop();

        if (!this._destroyAdToggle) {
          this.emit(this.AD_MODULE_PLAYBACK_COMPLETE, {
            id: this.playerNode,
            type: e.adServerType,
            error: false
          });
        } else {
          this.emit(this.AD_MODULE_PLAYBACK_DESTROY);
        }

        this._destroyAdToggle = false;

        this._adsTrackingProgress = [];

        this.onAdPlaybackStatusListener.remove();
      }
    },

    /**
     * _onClickTrackingElementClicked
     * @param e
     * @private
     */
    _onClickTrackingElementClicked: function (e) {
      console.log('adModule::_onClickTrackingElementClicked');

      this.emit(this.AD_MODULE_CLICK_TRACKING, e);
    },

    /**
     * _getTimePercent
     * @param currentTime
     * @param duration
     * @returns {*}
     * @private
     */
    _getTimePercent: function (currentTime, duration) {
      console.log('adModule::_getTimePercent');

      if (duration == 0) return 0;

      return (currentTime / duration).toFixed(2);
    },

    /**
     * _checkVideoPlaybackQuartile
     * @param timeAsPercent
     * @private
     */
    _checkVideoPlaybackQuartile: function (timeAsPercent) {
      console.log('adModule::_checkVideoPlaybackQuartile');

      var playbackQuartile = Math.floor(timeAsPercent * 4);

      if (this._adsTrackingProgress[playbackQuartile] != undefined) return;

      this._adsTrackingProgress[playbackQuartile] = true;

      this.emit(this.AD_MODULE_QUARTILE, {
        id: this.playerNode,
        adQuartile: this.adQuartile.getQuartileByIndex(playbackQuartile),
        error: false
      });
    },

    /**
     * _destroyAdlisteners
     * @private
     */
    _destroyAdlisteners: function () {
      console.log('adModule::_destroyAdlisteners');

      if (this.playbackOnDemandStatushandler) {
        this.playbackOnDemandStatushandler.remove();
      }
      if (this.clickTrackingElementClickedHandler) {
        this.clickTrackingElementClickedHandler.remove();
      }
      if (this.adPlaybackCompleteHandler) {
        this.adPlaybackCompleteHandler.remove();
      }
      if (this.adPlaybackErrorHandler) {
        this.adPlaybackErrorHandler.remove();
      }

      if (this.onAdPlaybackStatusListener) {
        this.onAdPlaybackStatusListener.remove();
      }

      if (this.adPlaybackDestroyHandler) {
        this.adPlaybackDestroyHandler.remove();
      }
    }
  });

  return adModule;
});
