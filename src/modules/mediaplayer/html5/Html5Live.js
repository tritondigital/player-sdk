/**
 * HTML5 Live
 *
 * @class Manage HTML5 live player
 *
 */
var i18n = require('sdk/base/util/I18n');
var OsPlatform = require('platform');
var Hls = require('hls.js');
var Const = require('sdk/base/util/Const');
var MediaElement = require('sdk/base/util/MediaElement');
const { toPlainObject } = require('lodash');
var isCloudStreaming = false;
var ltUpdateIntervall = null;
var switchingSeekTime = null;
var vid = Math.floor(Math.random() * 10001);

define([
  'dojo/_base/declare',
  'dojo/Evented',
  'dojo/_base/lang',
  'sdk/base/playback/PlaybackState',
  'sdk/modules/mediaplayer/html5/Html5Player',
  'sdk/modules/mediaplayer/sbm/SidebandMetadata',
  'sdk/modules/mediaplayer/html5/ASyncCuePointDispatcher',
  'dojo/topic',
  'sdk/base/playback/StreamingMode',
  'sdk/base/util/XhrProvider'
], function (declare, Evented, lang, PlaybackState, Html5Player, SidebandMetadata, ASyncCuePointDispatcher, topic, StreamingMode, XhrProvider) {
  var html5Live = declare([Evented], {
    /**
     * Convert html5 playback status code to dojo i18n localized messages
     *
     * @ignore
     */
    statusMap: {
      abort: {
        status: 'connecting',
        code: 'LIVE_CONNECTING'
      },
      canPlay: {
        status: 'buffering',
        code: 'LIVE_BUFFERING'
      },
      canPlayThrough: {
        status: 'onAir',
        code: 'LIVE_PLAYING'
      },
      dataLoading: {
        status: 'buffering',
        code: 'LIVE_BUFFERING'
      },
      emptied: {
        status: 'connecting',
        code: 'LIVE_CONNECTING'
      },
      ended: {
        status: 'disconnected',
        code: 'LIVE_STOP'
      },
      error: {
        status: 'streamUnavailable',
        code: 'LIVE_FAILED'
      },
      loadStart: {
        status: 'connecting',
        code: 'LIVE_CONNECTING'
      },
      pause: {
        status: 'paused',
        code: 'LIVE_PAUSE'
      },
      play: {
        status: 'onAir',
        code: 'LIVE_PLAYING'
      },
      progress: {
        status: 'onAir',
        code: 'LIVE_PLAYING'
      },
      reconnecting: {
        status: 'reconnecting',
        code: 'LIVE_RECONNECTING'
      },
      stalled: {
        status: 'disconnected',
        code: 'LIVE_STOP'
      },
      stop: {
        status: 'disconnected',
        code: 'LIVE_STOP'
      },
      suspend: {
        status: 'connecting',
        code: 'LIVE_CONNECTING'
      },
      waiting: {
        status: 'buffering',
        code: 'LIVE_BUFFERING'
      },
      playbackNotAllowed: {
        status: 'playbackNotAllowed',
        code: 'PLAY_NOT_ALLOWED'
      }
    },

    constructor: function (node, cfg) {
      console.log('html5Live::constructor');

      this.playerNode = node;
      this.cfg = cfg;
      this.html5Node = null;
      this.audioNode = null;
      this.connections = null;
      this._playbackStatusCallback = null;
      this._timeshiftInfoCallback - null;
      this._cuePointCallback = null;
      this._adBreakCallback = null;
      this._hlsCuePointCallback = null;
      this._speechCuePointCallback = null;
      this._customCuePointCallback = null;
      this._streamStartCallback = null;
      this._streamStopCallback = null;
      this._streamFailedCallback = null;

      this.isPaused = false;
      this.audioEventListenersAttached = false;
      this.params = null;
      this.xhrProv = new XhrProvider();
    },

    /**
     * Handler to get playback statuses
     *
     * @param callback
     *
     * @ignore
     */
    setPlaybackStatusHandler: function (callback) {
      this._playbackStatusCallback = callback;
    },

    setTimeshiftInfoHandler: function (callback) {
      this._timeshiftInfoCallback = callback;
    },

    /**
     * Handler to get cuepoints
     *
     * @param callback
     *
     * @ignore
     */
    setCuePointHandler: function (callback) {
      this._cuePointCallback = callback;
    },

    /**
     * Handler to get Ad break Cuepoints
     *
     * @param callback
     *
     * @ignore
     */
    setAdBreakHandler: function (callback) {
      this._adBreakCallback = callback;
    },

    /**
     * Handler to get Hls Cuepoints
     *
     * @param callback
     *
     * @ignore
     */
    setHlsCuePointHandler: function (callback) {
      this._hlsCuePointCallback = callback;
    },

    /**
     * Handler to get Speech Cuepoints
     *
     * @param callback
     *
     * @ignore
     */
    setSpeechCuePointHandler: function (callback) {
      this._speechCuePointCallback = callback;
    },

    /**
     * Handler to get Custom Cuepoints
     *
     * @param callback
     *
     * @ignore
     */
    setCustomCuePointHandler: function (callback) {
      this._customCuePointCallback = callback;
    },

    /**
     * Handler to know when stream starts
     *
     * @param callback
     *
     * @ignore
     */
    setStreamStartHandler: function (callback) {
      this._streamStartCallback = callback;
    },

    /**
     * Handler to know when stream stops
     *
     * @param callback
     *
     * @ignore
     */
    setStreamStopHandler: function (callback) {
      this._streamStopCallback = callback;
    },

    /**
     * Handler to know when stream failed
     *
     * @param callback
     *
     * @ignore
     */
    setStreamFailedHandler: function (callback) {
      this._streamFailedCallback = callback;
    },

    play: function (params) {
      if (params.forceTimeShift || params.isProgram) {
        isCloudStreaming = true;
      }

      if (MediaElement.isStopped()) {
        if (params) {
          this.params = params;
          console.log('html5Live::play', params);

          this._liveApiParams = params;

          this.mount = this._liveApiParams.mount;

          if (this.__isSidebandMetadataActivated()) {
            if (this.sidebandMetadata) {
              this.sidebandMetadata.destroy();
            }
            this.__activateSidebandMetadata();
          } else if (this.__isASyncCuePointDispatcherActivated()) {
            this.__activateAsyncCuePointDispatcher();
          }

          console.log('html5Live::play - url : ' + this._liveApiParams.url);

          this.__initAudioElement();

          // //enable hls lib only for ie11 > 8

          if (Hls.isSupported() && OsPlatform.os.family !== 'iOS' && (this._liveApiParams.isHLS || this._liveApiParams.isHLSTS)) {
            MediaElement.playAudio(this._liveApiParams.url, true, true, this._liveApiParams.timeshiftOffset, this._liveApiParams.timeshiftEnabled);
          } else {
            MediaElement.playAudio(this._liveApiParams.url, false, true, this._liveApiParams.timeshiftOffset, this._liveApiParams.timeshiftEnabled);
          }
        }
      }
    },

    pause: function () {
      if (isCloudStreaming || this.cfg.streamWhileMuted) {
        this.isPaused = true;
        this.stopLTInterval();
        MediaElement.pause();
      } else {
        this.isPaused = false;
        MediaElement.stop();
      }
    },

    stop: function () {
      MediaElement.stop();
      isCloudStreaming = false;
    },

    resume: function () {
      MediaElement.resume();
    },

    seekStream: function (seconds) {
      //If we are already in timeshift mode then seek, else switch
      if (isCloudStreaming) {
        MediaElement.seekStream(seconds);
      } else {
        switchingSeekTime = seconds;
        topic.publish('streamingModeChange', StreamingMode.CLOUD_STREAMING);
        isCloudStreaming = true;
      }
    },

    seekLive: function () {
      if (this._liveApiParams.forceTimeShift) {
        MediaElement.seekLive();
      } else {
        topic.publish('streamingModeChange', StreamingMode.LIVE_STREAMING);
        isCloudStreaming = false;
      }
    },

    seekFromLive: function (seconds) {
      if (isCloudStreaming) {
        MediaElement.seekFromLive(seconds);
      } else {
        switchingSeekTime = seconds;
        topic.publish('streamingModeChange', StreamingMode.CLOUD_STREAMING);
        isCloudStreaming = true;
      }
    },

    setVolume: function (volumePercent) {
      if (volumePercent == 0) {
        this.mute();
      } else {
        if (MediaElement.audioNode && MediaElement.audioNode.muted) {
          this.unMute();
        } else {
          MediaElement.setVolume(volumePercent);
        }
      }
    },

    mute: function () {
      if (MediaElement.audioNode && !MediaElement.audioNode.paused && !MediaElement.isStopped()) {
        if (isCloudStreaming) {
          MediaElement.audioNode.muted = true;
          this.stopLTInterval();
        } else {
          MediaElement.mute();
        }
      }
    },

    unMute: function (params) {
      if ((this.cfg.streamWhileMuted && MediaElement.audioNode) || isCloudStreaming) {
        MediaElement.audioNode.muted = false;
        if (isCloudStreaming) {
          if (MediaElement.audioNode && !MediaElement.audioNode.paused && !MediaElement.isStopped()) {
            this.startLTInterval();
          }
        }
      } else if (MediaElement.isStopped()) {
        MediaElement.unMute();
        this.play(params);
      }
    },

    /*********************************
     * Timeshift functions
     *********************************/

    startLTInterval: function () {
      if (ltUpdateIntervall == null) {
        var dist = (this.params.trackingParameters != null && this.params.trackingParameters.dist) || 'triton-web';
        var url = `${this._liveApiParams.listenerTrackingURL}?autoplay=0&hasads=0&sid=${this._liveApiParams.wcmStationId}&ctype=timeshifted&dist=${dist}&cb=${new Date().getTime()}&vid=${vid}`;
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Request failed with status ${reponse.status}`);
            }

            return response.text();
          })
          .then(data => {
            var ltParams = data.split(',');
            pingUrl = `${this._liveApiParams.listenerTrackingURL}?guid=${ltParams[1]}&cb=${new Date().getTime()}`;
            fetch(pingUrl, function (data) {});
            ltUpdateIntervall = setInterval(function () {
              fetch(pingUrl, function (data) {});
            }, parseInt(ltParams[0]) * 1000);
          })
          .catch(error => console.log(error));
      }
    },

    stopLTInterval: function () {
      if (ltUpdateIntervall != null) {
        clearInterval(ltUpdateIntervall);
        ltUpdateIntervall = null;
        console.log('Final Ping');
        fetch(pingUrl, function (data) {});
        pingUrl = null;
      }
    },

    /***************************************/
    /******* PRIVATE FUNCTIONS  ************/
    /***************************************/

    /**
     * Initialize Html5 player
     *
     * Dedicated html5 node is created
     * Html5 Class is instantiated
     *
     * @private
     *
     * @ignore
     */
    __initAudioElement: function () {
      console.log('html5Live::__initAudioElement');
      MediaElement.cfg = this.cfg;
      if (this.audioEventListenersAttached == false) {
        MediaElement.on('destroyAudioElement', this.__destroyAudioElement);
        MediaElement.on('html5-playback-status', lang.hitch(this, this.__onHTML5PlayerStatus));
        MediaElement.on('timeshift-info', lang.hitch(this, this._timeshiftInfoCallback));
        this.audioEventListenersAttached = true;
      }
    },

    __destroyAudioElement: function () {
      console.log('html5Live::__destroyAudioElement');
      MediaElement.removeAllListeners('html5-playback-status');
      MediaElement.removeAllListeners('destroyAudioElement');
      if (this.sidebandMetadata) {
        this.sidebandMetadata.destroy();
      }
    },

    _timeshiftInfoCallback: function (e) {
      if (this._timeshiftInfoCallback != null) {
        this._timeshiftInfoCallback(e);
      }
    },

    __onHTML5PlayerStatus: function (e) {
      console.log('html5Live::_onHTML5PlayerStatus - type=' + e.type);
      e.isReconnect = this.params && this.params.isReconnect ? true : false;
      if (e.type == PlaybackState.CAN_PLAY_THROUGH && switchingSeekTime && isCloudStreaming) {
        this.seekFromLive(switchingSeekTime);
        switchingSeekTime = null;
      } else if (e.type == PlaybackState.PLAY) {
        if (!this.isPaused && this.__isSidebandMetadataActivated() && this.sidebandMetadata) {
          this.sidebandMetadata.init(this._liveApiParams);
        } else if (this.aSyncCuePointDispatcher) {
          this.aSyncCuePointDispatcher.startCuePointsListener(this.mount);
        }

        this.isPaused = false;

        this._streamStartCallback();
        if (isCloudStreaming) {
          if (this._liveApiParams.wcmStationId && this._liveApiParams.listenerTrackingURL) {
            this.startLTInterval();
          }
        }
      } else if (
        e.type == PlaybackState.STOP ||
        (e.type == PlaybackState.PAUSE && !this.cfg.streamWhileMuted) ||
        e.type == PlaybackState.ERROR ||
        e.type == PlaybackState.ABORT ||
        e.type == PlaybackState.ENDED ||
        e.type == PlaybackState.PLAY_NOT_ALLOWED
      ) {
        if (this.aSyncCuePointDispatcher) {
          this.aSyncCuePointDispatcher.stopCuePointsListener();
        }

        if (e.type == PlaybackState.STOP || e.type == PlaybackState.ERROR || e.type == PlaybackState.ABORT || e.type == PlaybackState.PLAY_NOT_ALLOWED) {
          if (this.__isSidebandMetadataActivated() && this.sidebandMetadata) {
            this.sidebandMetadata.destroy();
          }

          this.stopLTInterval();
          this._streamStopCallback();
        }

        if (e.type == PlaybackState.ERROR || e.type == PlaybackState.ENDED) {
          this._streamFailedCallback();
          isCloudStreaming = false;
        }

        if (e.type == PlaybackState.PAUSE && !isCloudStreaming) {
          MediaElement.stop();
        }
      }

      this.__emitPlaybackStatus(e);
    },

    __isSidebandMetadataActivated: function () {
      return (
        this._liveApiParams != undefined &&
        this._liveApiParams.sbmConfig != undefined &&
        this._liveApiParams.sbmConfig !== null &&
        this._liveApiParams.sbmConfig.active &&
        this._liveApiParams.sbmConfig.info.active
      );
    },

    __isASyncCuePointDispatcherActivated: function () {
      return this._liveApiParams != undefined && this._liveApiParams.sbmConfig && this._liveApiParams.sbmConfig.aSyncCuePointFallback;
    },

    __onCuePoint: function (e) {
      this._cuePointCallback(e);
    },

    __onHlsCuePoint: function (e) {
      this._hlsCuePointCallback(e);
    },

    __onSpeechCuePoint: function (e) {
      this._speechCuePointCallback(e);
    },

    __onCustomCuePoint: function (e) {
      this._customCuePointCallback(e);
    },

    __onAdBreak: function (e) {
      this._adBreakCallback(e);
    },

    /**
     *
     * Activate SideBand Metadata mechanism
     *
     * @private
     */
    __activateSidebandMetadata: function () {
      if (!this.sidebandMetadata) {
        this.sidebandMetadata = new SidebandMetadata(this.audioNode);
      }
      this._liveApiParams.url = this.sidebandMetadata.getStreamConnectionUrl(this._liveApiParams.url);
      this.sidebandMetadata.setTrackCuePointCallback(lang.hitch(this, this.__onCuePoint));
      this.sidebandMetadata.setAdBreakCuePointCallback(lang.hitch(this, this.__onAdBreak));
      this.sidebandMetadata.setHlsCuePointCallback(lang.hitch(this, this.__onHlsCuePoint));
      this.sidebandMetadata.setSpeechCuePointCallback(lang.hitch(this, this.__onSpeechCuePoint));
      this.sidebandMetadata.setCustomCuePointCallback(lang.hitch(this, this.__onCustomCuePoint));

      if (this._liveApiParams.sbmConfig.aSyncCuePointFallback) {
        this.sidebandMetadata.setErrorCallback(lang.hitch(this, this.__onSidebandMetadataError));
      }
    },

    /**
     *
     * Activate AsyncCuePoint mechanism (Now Playing API polling)
     *
     * @private
     */
    __activateAsyncCuePointDispatcher: function () {
      if (this.aSyncCuePointDispatcher == undefined) {
        this.aSyncCuePointDispatcher = new ASyncCuePointDispatcher(this.cfg);
        this.aSyncCuePointDispatcher.setTrackCuePointCallback(lang.hitch(this, this.__onCuePoint));
        this.aSyncCuePointDispatcher.setAdBreakCuePointCallback(lang.hitch(this, this.__onAdBreak));
      }
    },

    /**
     *
     * Handler when SideBand Metadata Error happened
     *
     * @private
     */
    __onSidebandMetadataError: function () {
      if (MediaElement.isStopped()) return;

      if (!this.aSyncCuePointDispatcher) {
        this.__activateAsyncCuePointDispatcher();
      }

      this.aSyncCuePointDispatcher.startCuePointsListener(this.mount);
    },

    /**
     *
     * Dispatch Playback Status Event
     *
     * @param e
     * @private
     */
    __emitPlaybackStatus: function (e) {
      if (this._playbackStatusCallback != null) {
        var statusMessages = i18n.getLocalization();
        if (statusMessages == undefined) return;

        var msg = this.statusMap[e.type];
        if (msg && statusMessages[msg.status]) {
          this._playbackStatusCallback({
            status: statusMessages[msg.status],
            code: msg.code,
            message: e.message,
            isReconnect: e.isReconnect
          });
        }
      }
    }
  });

  return html5Live;
});
