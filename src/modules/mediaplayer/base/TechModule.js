/**
 * Base Tech Module
 */

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/has",
  "dojo/on",
  "dojo/dom",
  "sdk/modules/base/CoreModule",
  "dojo/topic",
  "dojo/io-query",
  "sdk/base/util/analytics/GAEventRequest",
  "sdk/base/util/XhrProvider",
], function (
  declare,
  lang,
  has,
  on,
  dom,
  coreModule,
  topic,
  ioQuery,
  GAEventRequest,
  XhrProvider
) {
  var module = declare([coreModule], {
    //30 seconds between the TimeOut Alert and the TimeOut Reached
    TIME_OUT_MESSAGE_DELAY: 30000,

    constructor: function (config, target, type) {
      console.log("techModule::constructor");

      this.type = type;
      this.volume = 1;

      this.xhrProv = new XhrProvider();
      this.params = null;
      this.connection = null;
      this._track = null;
      this._currentLiveApiParams = null;
      this.isLiveStream = false;
      this.lowActivated = false;
      this.playAdCalled = false;

      this.mount = null;
      this.station = null;

      this.__resetBackOff();

      this.config = config;
      if (config && config.playerId) {
        this.playerNode = dom.byId(config.playerId, document);
      }

      if (config && config.mount) {
        this.mount = config.mount;
      }

      if (config && config.station) {
        this.station = config.station;
      }

      this.hls = config.hls != undefined ? config.hls : true;
      this.audioAdaptive =
        config.audioAdaptive != undefined ? config.audioAdaptive : false;

      this.__initSbmConfig(config);
      //analytics
      this._playConnectionTime = 0;
      this._playConnectionTimeIntervall = null;

      this.isReconnect = false;
    },

    start: function () {
      console.log("techModule::start");

      on(this.target, "stream-start", lang.hitch(this, this.__onStreamStart));
      on(this.target, "stream-stop", lang.hitch(this, this.__onStreamStop));
      on(this.target, "stream-fail", lang.hitch(this, this.__onStreamFailed));
      on(
        this.target,
        "media-playback-started",
        lang.hitch(this, this._onMediaPlaybackStarted)
      );
      on(
        this.target,
        "media-playback-error",
        lang.hitch(this, this._onMediaPlaybackError)
      );
      on(
        this.target,
        "ad-break-cue-point",
        lang.hitch(this, this.__onAdBreakCuePoint)
      );
    },

    play: function (params) {
      this.isReconnect = false;
      if (params == null) {
        return;
      }

      this.params = params;
      console.log("techModule::play");

      /* Play a simple media file. Ex: podcast */
      if (params.file != undefined && params.file != "") {
        this.isLiveStream = false;
        this.__extractOmnyParameters(params);
        this.__playMedia(params);
        return;
      }

      this._currentLiveApiParams = params;
      /* Play a stream connection */
      if (this.connectionIterator) {
        this.isLiveStream = true;
        this.__connect(this.connectionIterator.current());
      } else {
        console.error("techModule::play - connectionIterator is not defined");
      }
    },

    setConnectionIterator: function (connectionIterator) {
      this.connectionIterator = connectionIterator;
    },

    currentConnection: function () {
      return this.connection;
    },

    currentTrack: function () {
      return this._track;
    },

    setCurrentTrack: function (track) {
      this._track = track;
    },

    _onMediaPlaybackStarted: function (e) {
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_ON_DEMAND,
        GAEventRequest.ACTION_PLAY,
        GAEventRequest.LABEL_SUCCESS
      );
    },

    _onMediaPlaybackError: function () {
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_ON_DEMAND,
        GAEventRequest.ACTION_PLAY,
        GAEventRequest.LABEL_ERROR
      );
    },

    __onStreamStart: function () {
      console.log("techModule::__onStreamStart");

      this.__resetBackOff();

      if (
        this._currentLiveApiParams &&
        this._currentLiveApiParams.connectionTimeOut > 0
      ) {
        console.log(
          "techModule::__onStreamStart - start the connection time-out, alert in " +
            this._currentLiveApiParams.connectionTimeOut +
            " minute(s)"
        );

        this.connectionTimeOutTimer = setInterval(
          lang.hitch(this, this.__onTimeOutAlert),
          this._currentLiveApiParams.connectionTimeOut * 60000
        );
      }
      //send analytics connection success load time
      var gaDimensions = {};
      if (this.connection) {
        gaDimensions[GAEventRequest.DIM_MEDIA_TYPE] = this.connection.type;
        gaDimensions[GAEventRequest.DIM_MOUNT] = this.connection.mount
          ? this.connection.mount
          : "";
        gaDimensions[GAEventRequest.DIM_STATION] = this._currentLiveApiParams
          .station
          ? this._currentLiveApiParams.station
          : "";
        gaDimensions[GAEventRequest.DIM_HLS] = this.hls;
        gaDimensions[GAEventRequest.DIM_AUDIO_ADAPTIVE] = this.audioAdaptive;
      }

      var gaMetrics = {};
      gaMetrics[GAEventRequest.METRIC_CONNECTION_TIME] =
        this._playConnectionTime;

      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_STREAMING,
        GAEventRequest.ACTION_PLAY,
        GAEventRequest.LABEL_SUCCESS
      );
    },

    __onStreamStop: function () {
      console.log("techModule::__onStreamStop");

      if (this.breakTimer) {
        clearInterval(this.breakTimer);
      }

      if (this.connectionTimeOutTimer) {
        clearInterval(this.connectionTimeOutTimer);
      }
    },

    __onStreamFailed: function () {
      console.error("techModule::__onStreamFailed");

      this.__reconnect();
    },

    __onStreamUnmute: function () {
      console.info("techModule::__onStreamUnmute");
      if (!this.connectionIterator) {
        return;
      }
      this.__reconnect();
    },

    __reconnect: function () {
      this.isReconnect = true;
      if (!this.connectionIterator) {
        console.error(
          "techModule::__reconnect - connectionIterator is not defined"
        );
        return;
      }

      if (this.connectionIterator.hasLooped()) {
        var delay = Math.min(this.backOffDelay << this.backOffRetry++, 60000);

        console.log("techModule::__reconnect - delay=" + delay);

        if (delay >= 60000) {
          //send analytics connection success load time
          var gaDimensions = {};
          gaDimensions[GAEventRequest.DIM_MOUNT] = this.connection.mount
            ? this.connection.mount
            : "";
          gaDimensions[GAEventRequest.DIM_STATION] = this._currentLiveApiParams
            .station
            ? this._currentLiveApiParams.station
            : "";

          GAEventRequest.requestGA(
            GAEventRequest.CATEGORY_STREAMING,
            GAEventRequest.ACTION_CONNECTION,
            GAEventRequest.LABEL_UNAVAILABLE,
            gaDimensions
          );
        }
        this.backOffTimer = setTimeout(
          lang.hitch(this, this.__onBackOffTimeOut),
          delay
        );
      } else {
        console.log("techModule::__reconnect");

        this.__connect(this.connectionIterator.next());
      }
    },

    __onBackOffTimeOut: function () {
      console.log("%c techModule::__onBackOffTimeOut", "background:#ff0000");
      this.connectionIterator.reset();
      this.__connect(this.connectionIterator.next());
    },

    __resetBackOff: function () {
      console.log("techModule::__resetBackOff");

      this.backOffRetry = 0;
      this.backOffDelay = Math.random() * 4000 + 1000;

      if (this.backOffTimer) clearTimeout(this.backOffTimer);
    },

    /**
     * Play media file
     *
     * @param {String} file
     * @private
     */
    __playMedia: function (params) {
      if (params == null) return;

      if (this.config.adStitcher == true && params.trackingParameters) {
        params.file +=
          (params.file.indexOf("?") != -1 ? "&" : "?") +
          ioQuery
            .objectToQuery(params.trackingParameters)
            .replace(/\./g, "%2E");
      }

      console.log("techModule::__playMedia url : " + params.file);

      this.playMedia({
        url: params.file,
        omnyOrganizationId: params.omnyOrganizationId,
        omnyClipId: params.omnyClipId,
        omnySessionId: params.omnySessionId,
        enableOmnyAnalytics: params.enableOmnyAnalytics,
      });
    },

    /**
     * Connect to the stream
     *
     * @param {Connection} connection
     * @private
     */
    __connect: function (connection) {
      if (connection == null) return;
      var self = this;
      this.connection = connection;

      if (this.connection != null) {
        this.mount = this.connection.mount ? this.connection.mount : null;
      }
      if (this._currentLiveApiParams != null) {
        this.station = this._currentLiveApiParams.station
          ? this._currentLiveApiParams.station
          : null;
      }

      if (this.connection.isGeoBlocked && this.connection.alternateContent) {
        topic.publish(
          "api/request",
          "get-alternate-content",
          this.connection.alternateContent
        );

        //send analytics geoblocking event
        var gaDimensions = {};
        gaDimensions[GAEventRequest.DIM_MOUNT] = this.connection.mount
          ? this.connection.mount
          : "";
        gaDimensions[GAEventRequest.DIM_STATION] = this._currentLiveApiParams
          .station
          ? this._currentLiveApiParams.station
          : "";
        gaDimensions[GAEventRequest.DIM_ALTERNATE_CONTENT] = true;

        GAEventRequest.requestGA(
          GAEventRequest.CATEGORY_STREAMING,
          GAEventRequest.ACTION_CONNECTION,
          GAEventRequest.LABEL_GEOBLOCKING,
          gaDimensions
        );

        return;
      } else if (this.connection.isGeoBlocked) {
        //send analytics geoblocking event
        var gaDimensions = {};
        gaDimensions[GAEventRequest.DIM_MOUNT] = this.connection.mount
          ? this.connection.mount
          : "";
        gaDimensions[GAEventRequest.DIM_STATION] = this._currentLiveApiParams
          .station
          ? this._currentLiveApiParams.station
          : "";
        gaDimensions[GAEventRequest.DIM_ALTERNATE_CONTENT] = false;

        GAEventRequest.requestGA(
          GAEventRequest.CATEGORY_STREAMING,
          GAEventRequest.ACTION_CONNECTION,
          GAEventRequest.LABEL_GEOBLOCKING,
          gaDimensions
        );
      }
      var params = this._currentLiveApiParams.trackingParameters || {};

      if (this.lowActivated && this.connection.isAudioAdaptive)
        params.utags = "low-bw";

      var mimeType = this.connection.mimeType;

      var streamUrl = this.connection.url;
      if (Object.keys(params).length > 0) {
        let sanitisedParams = this._sanitiseDistParam(
          streamUrl,
          JSON.parse(
            JSON.stringify(this._currentLiveApiParams.trackingParameters)
          )
        );
        streamUrl =
          streamUrl +
          "?" +
          ioQuery.objectToQuery(sanitisedParams) +
          "&burst-time=15";
      } else {
        streamUrl = streamUrl + "?burst-time=15";
      }

      this.emit("stream-select");
      //analytics start timer
      this._playConnectionTime = 0;
      if (!this._playConnectionTimeIntervall) {
        this._playConnectionTimeIntervall = setInterval(function () {
          self._playConnectionTime += 10;
        }, 10);
      }

      this.playStream({
        url: streamUrl,
        mimeType: mimeType,
        format: this.connection.format,
        timeShift: this._currentLiveApiParams.timeShift,
        forceTimeShift: this._currentLiveApiParams.forceTimeShift,
        uuidEnabled: this.connection.uuidEnabled,
        sendPageUrl: this.connection.sendPageUrl,
        hasVideo: this.connection.hasVideo,
        type: this.connection.type,
        mount: this.connection.mount,
        sbmConfig: this.__getSbmData(),
        isHLS: this.connection.isHLS,
        isHLSTS: this.connection.isHLSTS,
        wcmStationId: this.connection.wcmStationId,
        listenerTrackingURL: this.connection.listenerTrackingURL,
        isReconnect: this.isReconnect,
        mrHost: this.connection.mrHost,
        isProgram: this._currentLiveApiParams.isProgram,
        timeshiftOffset: this._currentLiveApiParams.offset,
        timeshiftEnabled: this._currentLiveApiParams.timeshiftEnabled,
      });
    },

    __getSbmData: function () {
      if (
        this._sbmConfig != null &&
        this._sbmConfig.active &&
        this.connection.metadata != null &&
        this.connection.metadata.sseSideband != null
      ) {
        this._sbmConfig.info = this.connection.metadata.sseSideband;
        return this._sbmConfig;
      } else {
        return this._sbmConfig;
      }
    },

    __onAdBreakCuePoint: function (e) {
      console.log("techModule::__onAdBreakCuePoint");
      console.log(e);

      var adBreakData = e.data.adBreakData;

      if (this.breakTimer) clearInterval(this.breakTimer);

      if (adBreakData.duration > 0) this.__initBreakTimer(adBreakData.duration); //milliseconds
    },

    __initBreakTimer: function (duration) {
      console.log("techModule::__initBreakTimer - duration=" + duration);

      this.breakTimer = setInterval(
        lang.hitch(this, this.__onBreakTimerComplete),
        duration
      );
    },

    __onBreakTimerComplete: function () {
      console.log("techModule::__onBreakTimerComplete");

      if (this.breakTimer) clearInterval(this.breakTimer);

      this.emit("ad-break-cue-point-complete");
    },

    __initSbmConfig: function (config) {
      if (config.sbm && !config.sbm.active) {
        //If SBM config has been set up and active is false
        this._sbmConfig = {
          active: false,
          aSyncCuePointFallback:
            config.sbm.aSyncCuePointFallback != undefined
              ? config.sbm.aSyncCuePointFallback
              : true,
        };
      } else if (config.sbm && config.sbm.active) {
        //If SBM config has been set up and active is true
        this._sbmConfig = {
          active: true,
          aSyncCuePointFallback:
            config.sbm.aSyncCuePointFallback != undefined
              ? config.sbm.aSyncCuePointFallback
              : true,
        };
      } else if (this.type == "Html5") {
        //If SBM config has NOT been set up, then SBM is activated AND aSyncCuePoint is activated
        this._sbmConfig = {
          active: true,
          aSyncCuePointFallback: true,
        };
      } else {
        this._sbmConfig = null;
      }
    },

    prepare: function (module) {
      console.log("techModule::prepare");

      if (module === "adModule") {
        this.playAdCalled = true;
      }
    },

    playStream: function (params) {
      console.log("techModule::playingStream");
    },

    pause: function () {
      console.log("techModule::pause");
      this.isLiveStream == true ? this.pauseStream() : this.pauseMedia();
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_DEFAULT,
        GAEventRequest.ACTION_PAUSE,
        GAEventRequest.LABEL_SUCCESS,
        this.getDefaultGADimensions()
      );
    },

    stop: function () {
      console.log("techModule::stop");

      if (this.isLiveStream) {
        this.__resetBackOff();
        this.stopStream();
      } else {
        this.stopMedia();
      }
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_DEFAULT,
        GAEventRequest.ACTION_STOP,
        GAEventRequest.LABEL_SUCCESS,
        this.getDefaultGADimensions()
      );
    },

    resume: function () {
      console.log("techModule::resume");
      this.isLiveStream == true ? this.resumeStream() : this.resumeMedia();
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_DEFAULT,
        GAEventRequest.ACTION_RESUME,
        GAEventRequest.LABEL_SUCCESS,
        this.getDefaultGADimensions()
      );
    },

    seek: function (seekOffset) {
      console.log("techModule::seekStream - seekOffset=" + seekOffset);

      this.isLiveStream == true
        ? this.seekStream(seekOffset)
        : this.seekMedia(seekOffset);
    },

    seekLive: function () {
      console.log("techModule::seekLive");
    },

    restartConnectionTimeOut: function () {
      console.log("techModule::restartConnectionTimeOut");

      if (this.connectionTimeOutTimer)
        clearInterval(this.connectionTimeOutTimer);

      if (this._currentLiveApiParams.connectionTimeOut > 0)
        this.connectionTimeOutTimer = setInterval(
          lang.hitch(this, this.__onTimeOutAlert),
          this._currentLiveApiParams.connectionTimeOut * 60000
        );
    },

    setVolume: function (volumePercent) {
      console.log("techModule::setVolume - volumePercent=" + volumePercent);

      this.volume = volumePercent;
    },

    getVolume: function () {
      return this.volume;
    },

    mute: function () {
      console.log("techModule::mute");
      this.isLiveStream == true ? this.muteStream() : this.muteMedia();
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_DEFAULT,
        GAEventRequest.ACTION_MUTE,
        GAEventRequest.LABEL_SUCCESS,
        this.getDefaultGADimensions()
      );
    },

    unMute: function () {
      console.log("techModule::unMute");
      this.isLiveStream == true ? this.unMuteStream() : this.unMuteMedia();
      GAEventRequest.requestGA(
        GAEventRequest.CATEGORY_DEFAULT,
        GAEventRequest.ACTION_UNMUTE,
        GAEventRequest.LABEL_SUCCESS,
        this.getDefaultGADimensions()
      );
    },

    playAd: function (adServerType, config) {
      console.log("techModule::playAd - adServerType=" + adServerType);
      this.playAdCalled = true;
    },

    skipAd: function () {
      console.log("techModule::skipAd");
    },

    destroyAd: function () {
      console.log("techModule::destroyAd");
    },

    reloadSyncBanner: function () {
      console.log("techModule::reloadSyncBanner");
    },

    __onTimeOutAlert: function () {
      console.log("techModule::_onTimeOutAlert");

      if (this.connectionTimeOutTimer)
        clearInterval(this.connectionTimeOutTimer);

      this.connectionTimeOutTimer = setInterval(
        lang.hitch(this, this.__onTimeOutReached),
        this.TIME_OUT_MESSAGE_DELAY
      );

      this.emit("timeout-alert");
    },

    __onTimeOutReached: function () {
      console.log("techModule::_onTimeOutReached");

      if (this.connectionTimeOutTimer)
        clearInterval(this.connectionTimeOutTimer);

      this.stopStream();

      this.emit("timeout-reach");
    },

    _createUUID: function () {
      // http://www.ietf.org/rfc/rfc4122.txt
      var s = [];
      var hexDigits = "0123456789abcdef";
      for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";

      var uuid = s.join("");
      return uuid;
    },

    /**
     * Extract Omny Usage Analytics Parameters
     * e.g https://traffic.omny.fm/d/clips/233f32b3-2136-45a7-b0f5-aab200d79708/677817d0-1b13-4cf1-b14a-aad300e0954c/43701cc5-87ca-46ff-a714-ac5200a853af/audio.mp3
     * @param {String} file
     * @private
     */
    __extractOmnyParameters: function (params) {
      if (params == null) return;

      if (
        (params.omnyOrganizationId == undefined ||
          params.omnyClipId == undefined) &&
        params.enableOmnyAnalytics &&
        params.file.indexOf("omny.fm") > -1
      ) {
        var urlParts = params.file.split("/");
        params.omnySessionId = this._createUUID();
        params.omnyOrganizationId = urlParts[5];
        params.omnyClipId = urlParts[7];
      }
    },
    getDefaultGADimensions: function () {
      var gaDimensions = {};
      if (this.mount != null) {
        gaDimensions[GAEventRequest.DIM_MOUNT] = this.mount;
      }
      if (this.station != null) {
        gaDimensions[GAEventRequest.DIM_STATION] = this.station;
      }
      return gaDimensions;
    },

    _sanitiseDistParam: function (streamUrl, params) {
      let isTimeshift =
        streamUrl.indexOf("/HLSRW/") > -1 || streamUrl.indexOf("/CLOUD/") > -1;

      if (isTimeshift && params["dist-timeshift"]) {
        params.dist = params["dist-timeshift"];
        delete params["dist-timeshift"];
      } else if (!isTimeshift && params["dist-timeshift"]) {
        delete params["dist-timeshift"];
      }

      return params;
    },
  });

  return module;
});
