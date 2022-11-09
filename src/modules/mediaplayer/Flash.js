var i18n = require("sdk/base/util/I18n");
var Platform = require("sdk/base/util/Platform");
var flvjs = require("sdk/lib/flv.js");
var PlaybackState = require("sdk/base/playback/PlaybackState");

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/dom",
  "dojo/dom-attr",
  "sdk/base/cuepoints/TrackCuePoint",
  "sdk/base/cuepoints/BreakCuePoint",
  "sdk/base/cuepoints/HlsCuePoint",
  "sdk/modules/base/ErrorCode",
  "./base/TechModule",
  "dojo/dom-construct",
  "dojo/topic",
  "sdk/modules/ad/AdManager",
  "sdk/modules/mediaplayer/html5/Html5OnDemand",
], function (
  declare,
  lang,
  dom,
  domAttr,
  TrackCuePoint,
  BreakCuePoint,
  HlsCuePoint,
  errorCode,
  techModule,
  domConstruct,
  topic,
  AdManager,
  Html5OnDemand
) {
  var module = declare([techModule], {
    // summary:
    //        A module for MediaPlayer that utilizes a Flash SWF for handling Flash SWF Controller (stream playback, vast ads, etc).
    //        Mobile and tablets will use the HTML5 module.
    //
    // description:
    //        All properties and methods listed here are specific to the Flash plugin only.

    /**
     * @var {string[]} Supported Events list
     */
    SUPPORTED_EVENTS: [
      "onMetaData",
      "onCuePoint",
      "onCuePointPreview",
      "onCuePointPreviewExpired",
    ],

    /* Map the xml properties with Track & Ad CuePoints properties */
    cuePointMap: {
      timestamp: "timestamp",
      type: "name",
      /*Track CuePoint*/
      cue_title: TrackCuePoint.CUE_TITLE,
      track_artist_name: TrackCuePoint.ARTIST_NAME,
      track_album_name: TrackCuePoint.ALBUM_NAME,
      program_id: TrackCuePoint.PROGRAM_ID,
      cue_time_duration: TrackCuePoint.CUE_TIME_DURATION,
      cue_time_start: TrackCuePoint.CUE_TIME_START,
      track_id: TrackCuePoint.TRACK_ID,
      track_nowplaying_url: TrackCuePoint.NOW_PLAYING_URL,
      track_cover_url: TrackCuePoint.TRACK_COVER_URL,
      /*Break CuePoint*/
      ad_id: BreakCuePoint.AD_ID,
      ad_type: BreakCuePoint.AD_TYPE,
      cue_title: BreakCuePoint.CUE_TITLE,
      cue_time_duration: BreakCuePoint.CUE_TIME_DURATION,
      ad_url: BreakCuePoint.AD_URL,
      ad_vast_url: BreakCuePoint.AD_VAST_URL,
      ad_vast: BreakCuePoint.AD_VAST,
      /*HLS CuePoint*/
      hls_track_id: HlsCuePoint.HLS_TRACK_ID,
      hls_segment_id: HlsCuePoint.HLS_SEGMENT_ID,
    },

    /**
     * Events sent by Flash object: the key NAME is the function called by flash on window, the key VALUE is the associated event name to emit
     * onAdBreakDurationReached is not listened, this is done in another Module in JavaScript. This callback from flash is not removed in flash api for retro-compatibility.
     *
     * Dev note: if the key VALUE starts with the character underscore '_func' then the function in this class will be called instead of dispatching the event directly. (cf. this._onStreamStatus)
     *
     * @ignore
     * */
    eventMap: {
      onPlayerReady: "tech-ready",
      onStreamStarted: "stream-start",
      onStreamStopped: "stream-stop",
      onStreamFailed: "stream-fail",
      onStreamStatus: "_onStreamStatus",
      onTrackCuePoint: "_onTrackCuePoint",
      onSpeechCuePoint: "_onSpeechCuePoint",
      onCustomCuePoint: "_onCustomCuePoint",
      onTargetSpot: "targetspot-cue-point",
      onAdBreak: "_onAdBreakCuePoint",
      onSeekFailed: "seek-fail",
      onSeekInvalidTime: "seek-invalid-time",
      onTimeShiftPlaybackModeChanged: "time-shift-playback-mode-change",
      onTimeShiftStreamStart: "time-shift-stream-start",
      onTimeShiftPlayheadUpdate: "time-shift-playhead-update",
      onAdPlaybackStart: "ad-playback-start",
      onAdPlaybackComplete: "ad-playback-complete",
      onAdPlaybackError: "_onAdPlaybackError",
      onAdPlaybackSkippableState: "ad-playback-skippable-state",
      onAdCountdown: "ad-countdown",
      onAdQuartile: "ad-quartile",
      onVastProcessComplete: "vast-process-complete",
      onVastCompanionsReady: "vast-companions-ready",
      onConfigurationError: "configuration-error",
      onVideoMidRollPlaybackStart: "video-mid-roll-playback-start",
      onVideoMidRollPlaybackComplete: "video-mid-roll-playback-complete",
      onVpaidAdCompanions: "vpaid-ad-companions",
      onMediaLoadingStatus: "media-loading-status", //FIXME i18n.getLocalization
      onMediaPlaybackStatus: "_onMediaPlaybackStatus",
      onMediaPlaybackTimeUpdate: "media-playback-timeupdate",
      onMediaPlaybackMetadata: "media-playback-metadata",
      onMediaError: "_onMediaError"
    },

    /**
     * Convert flash stream status code to dojo i18n localized messages
     *
     * @ignore
     */
    statusMap: {
      LIVE_PAUSE: "paused",
      LIVE_PLAYING: "onAir",
      LIVE_STOP: "disconnected",
      LIVE_FAILED: "streamUnavailable",
      LIVE_BUFFERING: "buffering",
      LIVE_CONNECTING: "connecting",
      LIVE_RECONNECTING: "reconnecting",
      MEDIA_TIME_UPDATE: "timeupdate",
      MEDIA_SEEK_FAILED: "seekfailed",
      MEDIA_SEEK_INVALID_TIME: "seekinvalidtime",
      MEDIA_ENDED: "ended",
      MEDIA_PAUSED: "pause",
      MEDIA_STARTED: "play",
      MEDIA_STOPPED: "stop",
      MEDIA_RESUMED: "play",
      MEDIA_SEEKED: "play",
      MEDIA_BUFFERING: "buffering",
    },

    CDN_URL: "sdk.listenlive.co",

    constructor: function (config, target, type) {
      console.log("flash::constructor - playerId:" + config.playerId);
      this.adManager = null;
      this.errorCode = new errorCode();
      this.target = target;

      this.config.platformId =
        this.config.platformId != undefined && this.config.platformId != ""
          ? this.config.platformId
          : "prod01"; //prod01 by default
      var platform = new Platform(this.config.platformId);

      this.config.moduleDir = platform.endpoint.coreModuleDir;

      this._isAdBreak = false;
      this.playerStarted;

      this.inherited(arguments);
    },

    /*************************
     *       Public Events     *
     *************************/

    start: function () {
      console.log("flash::start - playerId:" + this.config.playerId);

      this.inherited(arguments);

      if (flvjs.isSupported()) {
        this._embedFlash();
      }

      this.html5OnDemand = new Html5OnDemand(this.playerNode);
    },

    _onReady: function () {
      console.log("flash::_onReady");

      // summary:
      //        Stub - Fired when embedFlash has created the
      //        Flash object, but it has not necessarilly finished
      //        downloading, and is ready to be communicated with.
    },

    _onError: function (data) {
      error = {};
      error.code = 1;
      error.message = data;

      console.error(
        "flash::_onError - code : " +
          error.code +
          ", message : " +
          error.message
      );

      this.emit("tech-error", {
        error: error,
      });
    },

    _onMetadata: function (metadata) {
      console.log("flash::_onMetadata: " + metadata);
      this.emit("metadata-cue-point", metadata);
    },

    _onStreamData: function (data) {
      delay = data.timestamp - (new Date().getTime() - this.playerStarted);
      data.delay = delay;
      window.setTimeout(() => {
        this.emit("stream-data", data);
      }, delay);      
    },

    /*************************
     *       Public Methods     *
     *************************/

    prepare: function (params) {
      this.inherited(arguments);
    },

    playStream: function (params) {
      this.inherited(arguments);

      console.log("flash::playStream - will play streamUrl:" + params.url);

      this._createPlayer(params.url);
      this.emit("flv-player-status", { type: "stream", status: "playing" });
    },

    pauseStream: function () {
      this.inherited(arguments);

      this.flashMovie.tdPlayer_pauseStream();
    },

    stopStream: function () {
      this.inherited(arguments);
      if (this.player) {
        this.player.pause();
        this.player.unload();
        this.player.detachMediaElement();
        this.player.destroy();
        this.player = null;
        this.emit("flv-player-status", { type: "stream", status: "stopped" });
      }
    },

    resumeStream: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_resumeStream == "function")
        this.flashMovie.tdPlayer_resumeStream();
    },

    seekStream: function (seekOffset) {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_seekStream == "function")
        this.flashMovie.tdPlayer_seekStream(seekOffset);
    },

    seekLive: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_seekLive == "function")
        this.flashMovie.tdPlayer_seekLive();
    },

    setVolume: function (volumePercent) {
      this.inherited(arguments);
      this.videoNode.volume = volumePercent;
    },

    mute: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_mute == "function")
        this.flashMovie.tdPlayer_mute();
    },

    unMute: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_unMute == "function")
        this.flashMovie.tdPlayer_unMute();
    },

    skipAd: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_skipAd == "function")
        this.flashMovie.tdPlayer_skipAd();
    },

    playMedia: function (params) {
      this.inherited(arguments);
      this._createPlayer(params.url);
      this.emit("flv-player-status", { type: "media", status: "playing" });
    },

    pauseMedia: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_pauseMedia == "function")
        this.flashMovie.tdPlayer_pauseMedia();
    },

    resumeMedia: function () {
      this.inherited(arguments);

      if (typeof this.flashMovie.tdPlayer_resumeMedia == "function")
        this.flashMovie.tdPlayer_resumeMedia();
    },

    stopMedia: function () {
      this.inherited(arguments);
      if (this.player) {
        this.player.pause();
        this.player.unload();
        this.player.detachMediaElement();
        this.player.destroy();
        this.player = null;
        this.emit("flv-player-status", { type: "media", status: "stopped" });
      }
    },

    seekMedia: function (seekOffset) {
      this.inherited(arguments);

      if (seekOffset == 0) seekOffset = 0.001; //FIXME: BECAUSE SEEK TO 0 RESULTS TO INVALID SEEK TIME

      if (typeof this.flashMovie.tdPlayer_seekMedia == "function")
        this.flashMovie.tdPlayer_seekMedia(seekOffset);
    },

    /*************************
     *       Private Methods     *
     *************************/

    _onStop: function () {
      this._emitStreamStatus(PlaybackState.STOP);
    },

    _onPlay: function () {
      this._emitStreamStatus(PlaybackState.PLAY);
    },

    _emitStreamStatus: function (playbackState) {
      var statusMessages = i18n.getLocalization();
      if (statusMessages == undefined) return;

      let msg = {};
      msg.status = statusMessages[playbackState];

      if (msg.status) {
        this.emit("stream-status", msg);
      }
    },

    _onStreamStatus: function (data) {
      console.log(
        "flash::_onStreamStatus - code:" + data.code + ", status:" + data.status
      );

      var targetNode = dom.byId(data.id, document);
      if (targetNode) {
        var statusMessages = i18n.getLocalization();

        var msg = this.statusMap[data.code];
        if (msg && statusMessages[msg]) data.status = statusMessages[msg];

        this.emit("stream-status", data, targetNode);
      } else {
        console.log("flash::Cannot fire the event:stream-status");
      }
    },

    _onMediaPlaybackStatus: function (data) {
      console.log(
        "flash::_onMediaPlaybackStatus - code:" +
          data.code +
          ", status:" +
          data.status
      );

      var targetNode = dom.byId(data.id, document);
      if (targetNode) {
        var statusMessages = i18n.getLocalization();

        var msg = this.statusMap[data.code];
        if (msg && statusMessages[msg]) data.status = statusMessages[msg];

        if (data.code === "MEDIA_STARTED") {
          this.emit("media-playback-started");
        }
        this.emit("media-playback-status", data, targetNode);
      } else {
        console.log("flash::Cannot fire the event:stream-status");
      }
    },

    _onMediaError: function (data) {
      console.log("flash::_onMediaError:" + data.error);

      var targetNode = dom.byId(data.id, document);
      if (targetNode) {
        var statusMessages = i18n.getLocalization();

        if (statusMessages["error"]) data.error = statusMessages["error"];

        this.emit("media-playback-error", data, targetNode);
      } else {
        console.log("flash::Cannot fire the event:media-error");
      }
    },

    _onTrackCuePoint: function (data) {
      console.log("flash::_onTrackCuePoint");

      this.emit("track-cue-point", data);
    },

    _onSpeechCuePoint: function (data) {
      console.log("flash::_onSpeechCuePoint");

      if (data.cuePoint) {
        data.cuePoint.mount = this.connection.mount;
      }

      this.emit("speech-cue-point", data);
    },

    _onCustomCuePoint: function (data) {
      console.log("flash::_onCustomCuePoint");

      if (data.cuePoint) {
        data.cuePoint.mount = this.connection.mount;
      }

      this.emit("custom-cue-point", data);
    },

    _onAdBreakCuePoint: function (data) {
      console.log("flash::_onAdBreakCuePoint");

      this._adBreak = data.adBreakData.isVastInStream ? true : false;

      this.emit("ad-break-cue-point", data);
    },

    _onAdPlaybackError: function (data) {
      console.log("flash::_onAdPlaybackError");

      if (!this._adBreak) {
        //IMPORTANT : ad-playback-error event is not emit if it's an AdBreak !!!
        this.emit("ad-playback-error", data);
      }
    },

    _onLoadingComplete: function (data) {
      console.log("THE LOADING IS COMPLETE!!!!");
    },

    _onScriptData: function (data) {
      console.log("flash:message received:" + JSON.stringify(data));
      console.log(data);

      //if( message.type != undefined && !this.__isSupportedEvent( message ) ) return;

      var cuePoint = {};

      if (data.onCuePoint) {
        cuePoint = this.__onCuePoint(data.onCuePoint);
        cuePoint.tagTimestamp = data.tagTimestamp;
        cuePoint.parameters.tag_timestamp = data.tagTimestamp;
        if (cuePoint.parameters.tag_timestamp) {
          cuePoint.parameters.tag_timestamp_formatted = this.toHHMMSS(
            data.tagTimestamp / 1000
          );
        }

        if (data.tagTimestamp == 0) {
          this.playerStarted = new Date().getTime();
        }

        delay = data.tagTimestamp - (new Date().getTime() - this.playerStarted);
        cuePoint.parameters.time_played = moment(
          new Date().getTime() + delay
        ).format("HH:mm:ss.SSS");

        if (cuePoint.type == "ad") {
          var adBreakData = {};
          adBreakData.type = "ad";
          adBreakData.tagTimestamp = data.tagTimestamp;
          adBreakData.tagTimestampFormatted = this.toHHMMSS(
            data.tagTimestamp / 1000
          );
          adBreakData.timePlayed = cuePoint.parameters.time_played;
          adBreakData.adVast =
            cuePoint[BreakCuePoint.AD_VAST] != undefined &&
            cuePoint[BreakCuePoint.AD_VAST] != ""
              ? cuePoint[BreakCuePoint.AD_VAST]
              : null;
          adBreakData.adType =
            cuePoint[BreakCuePoint.AD_TYPE] != undefined &&
            cuePoint[BreakCuePoint.AD_TYPE] != ""
              ? cuePoint[BreakCuePoint.AD_TYPE]
              : null;
          adBreakData.cueID =
            cuePoint[BreakCuePoint.AD_ID] != undefined &&
            cuePoint[BreakCuePoint.AD_ID] != ""
              ? cuePoint[BreakCuePoint.AD_ID]
              : null;
          adBreakData.cueTitle =
            cuePoint[BreakCuePoint.CUE_TITLE] != undefined &&
            cuePoint[BreakCuePoint.CUE_TITLE] != ""
              ? cuePoint[BreakCuePoint.CUE_TITLE]
              : null;
          adBreakData.duration =
            cuePoint[BreakCuePoint.CUE_TIME_DURATION] != undefined &&
            cuePoint[BreakCuePoint.CUE_TIME_DURATION] != ""
              ? cuePoint[BreakCuePoint.CUE_TIME_DURATION]
              : null;
          adBreakData.isVastInStream =
            (cuePoint[BreakCuePoint.AD_VAST_URL] != undefined &&
              cuePoint[BreakCuePoint.AD_VAST_URL] != "") ||
            (cuePoint[BreakCuePoint.AD_VAST] &&
              cuePoint[BreakCuePoint.AD_VAST] != "")
              ? true
              : false;
          adBreakData.url =
            cuePoint[BreakCuePoint.AD_URL] != undefined &&
            cuePoint[BreakCuePoint.AD_URL] != ""
              ? cuePoint[BreakCuePoint.AD_URL]
              : null;
          adBreakData.vastUrl =
            cuePoint[BreakCuePoint.AD_VAST_URL] != undefined &&
            cuePoint[BreakCuePoint.AD_VAST_URL] != ""
              ? cuePoint[BreakCuePoint.AD_VAST_URL]
              : null;
          
          setTimeout(() => {
            if (
              adBreakData.isVastInStream == true &&
              (adBreakData.adVast || adBreakData.vastUrl)
            ) {
              topic.publish("api/request", "get-vast-instream", adBreakData);
            }
            
            this._onAdBreakCuePoint({
              adBreakData: adBreakData,
              cuePoint: cuePoint,
            });
          }, delay);
        } else {
          window.setTimeout(() => {
            this._onTrackCuePoint({ cuePoint: cuePoint });
          }, delay);
        }
      } 
    },    

    __onCuePoint: function (data) {
      console.log("flash:cuePoint received");

      var cuePoint = {};

      cuePoint.parameters = data.parameters;
      cuePoint.timestamp = data.timestamp;
      cuePoint.type = data.name;

      for (var key in data.parameters) {
        //cuePoint properties names are map with the object this.cuePointMap
        if (this.cuePointMap[key]) {
          cuePoint[this.cuePointMap[key]] = data.parameters[key];
        }
      }

      if (cuePoint.type == "ad")
        cuePoint["isVastInStream"] =
          (cuePoint[BreakCuePoint.AD_VAST_URL] != undefined &&
            cuePoint[BreakCuePoint.AD_VAST_URL] != "") ||
          (cuePoint[BreakCuePoint.AD_VAST] &&
            cuePoint[BreakCuePoint.AD_VAST] != "")
            ? true
            : false;

      return cuePoint;
    },

    __isSupportedEvent: function (event) {
      return array.indexOf(this.SUPPORTED_EVENTS, event.type) != -1;
    },

    _tdPlayerEvents: function (eventName, data) {
      console.log(
        "flash::tdPlayerEvents - eventName=" + eventName + ", data=" + data.id
      );
      console.log(data);

      var targetNode = dom.byId(data.id, document);

      //Call internal function
      if (this.eventMap[eventName].substr(0, 1) == "_") {
        var fn = lang.hitch(this, this.eventMap[eventName]);
        fn(data, eventName);
      } else if (targetNode && this.eventMap[eventName]) {
        //Emit event
        console.log(
          "flash::event mapping:" +
            eventName +
            "/" +
            this.eventMap[eventName] +
            " on target id:" +
            targetNode.id
        );
        this.emit(this.eventMap[eventName], data, targetNode);
      } else {
        console.log("flash::Cannot fire the event:" + eventName);
      }
    },

    __createMediaTag: function (mediaTagType) {
      if (!mediaTagType) return;

      var node = domConstruct.create(
        mediaTagType,
        { id: "tdplayer_flv_" + mediaTagType + "node", type: mediaTagType },
        this.flvNode,
        "first"
      );
      domAttr.set(node, "height", "0%");
      domAttr.set(node, "width", "0%");
      domAttr.set(node, "x-webkit-airplay", "allow"); //AirPlay support
      var sourceNode = domConstruct.create(
        "source",
        { id: "tdplayer_flv" + mediaTagType + "source" },
        node,
        "first"
      );
      domAttr.set(sourceNode, "src", "");
      domAttr.set(node, "playsinline", "");

      return node;
    },

    _createPlayer: function (url) {
      this.player = flvjs.createPlayer({
        type: "flv",
        url: url,
      });

      this.videoNode.addEventListener("play", lang.hitch(this, this._onPlay));
      this.videoNode.addEventListener("abort", lang.hitch(this, this._onStop));
      this.videoNode.addEventListener("ended", lang.hitch(this, this._onStop));
      this.videoNode.addEventListener("pause", lang.hitch(this, this._onStop));

      this.player.attachMediaElement(this.videoNode);

      this.player.load();
      this.player.play();
      this.player.on(
        flvjs.Events.METADATA_ARRIVED,
        lang.hitch(this, this._onMetadata)
      );

      this.player.on(
        flvjs.Events.STREAMDATA_ARRIVED,
        lang.hitch(this, this._onStreamData)
      );

      this.player.on(flvjs.Events.ERROR, lang.hitch(this, this._onError));

      this.player.on(flvjs.Events.MEDIA_INFO, (e) =>
        console.log("Media Info Arrived:" + JSON.stringify(e))
      );

      this.player.on(
        flvjs.Events.SCRIPTDATA_ARRIVED,
        lang.hitch(this, this._onScriptData)
      );

      this.playerStarted = new Date().getTime() + 1;
    },

    _embedFlash: function () {
      // summary:
      //        Internal. Creates Flash TDPlayer

      console.log("flash::_embedFlash - id:" + this.playerNode.id);
      // Subscribing to published events coming from the Flash.
      // The flash div node id is available in data.id, so more than one player can be on a page and can have unique calls.
      window.tdPlayerEvents = lang.hitch(this, this._tdPlayerEvents);

      var statusMessages = i18n.getLocalization();

      //By default, directLiveStream plugin is activated
      var corePlugins = [
        {
          id: "directLiveStream",
        },
      ];

      //TimeShift configuration. By default the max_listening_time is 30 minutes
      corePlugins[0].timeshift = this.config.timeShift
        ? {
            active: this.config.timeShift.active || 0,
            max_listening_time: this.config.timeShift.max_listening_time || 30,
          }
        : {
            active: 0,
          };

      if (this.config.plugins != undefined && this.config.plugins.length > 0)
        corePlugins = corePlugins.concat(this.config.plugins);

      var playerConfig = {
        playercore: {
          platform_id: this.config.platformId,
          plugins: corePlugins,
        },
      };

      if (this.config.moduleDir != null)
        playerConfig.playercore.module_dir = this.config.moduleDir;

      console.log("flash::_embedFlash - player config:");

      //clean td_container div
      document.getElementById(this.config.playerId).innerHTML = "";

      // create flash object
      var flashContentId = "flash_content";
      domConstruct.create(
        "div",
        {
          id: flashContentId,
        },
        document.getElementById(this.config.playerId)
      );

      if (this.flvNode == null) {
        this.flvNode = domConstruct.create(
          "div",
          { id: "tdplayer_flv" },
          this.playerNode,
          "first"
        );
      }

      if (!this.videoNode) {
        this.videoNode = this.__createMediaTag("video");
      }

      this._techReady();
    },

    toHHMMSS: function (value) {
      var sec_num = parseInt(value, 10); // don't forget the second param
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      var seconds = sec_num - hours * 3600 - minutes * 60;

      if (hours < 10) {
        hours = "0" + hours;
      }
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      return hours + ":" + minutes + ":" + seconds;
    },

    _techReady: function () {
      this.emit("tech-ready", {
        id: this.playerNode,
      });
    },
  });

  return module;
});
