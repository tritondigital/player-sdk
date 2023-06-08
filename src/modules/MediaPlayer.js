/**
 * @module MediaPlayer
 *
 * @desc
 * Media Player playback (audio and video), for both Flash & HTML5, Ad playback, Connection timeout, Volume control.<br>
 * Flash is used only if it's available, if not HTML5 is used as a fallback.
 * <h5>Events fired:</h5><br>
 * module-ready<br>
 * module-error<br>
 * configuration-error<br>
 * <b>Stream events:</b><br>
 * stream-geo-blocked<br>
 * stream-start
 * stream-stop<br>
 * stream-fail<br>
 * stream-error<br>
 * stream-status<br>
 * stream-track-change<br>
 * <b>CuePoints events:</b><br>
 * track-cue-point<br>
 * speech-cue-point<br>
 * custom-cue-point<br>
 * targetspot-cue-point<br>
 * ad-break-cue-point<br>
 * ad-break-cue-point-complete<br>
 * hls-cue-point<br>
 * <b>Seeking events:</b><br>
 * seek-fail<br>
 * seek-invalid-time<br>
 * time-shift-playback-mode-change<br>
 * time-shift-stream-start<br>
 * time-shift-playhead-update<br>
 * timeout-alert<br>
 * timeout-reach<br>
 * stream-config-ready<br>
 * stream-config-error<br>
 * stream-config-load-error
 */

var AudioPriority = require("sdk/modules/mediaplayer/liveStreamConfigApi/AudioPriority");
var OsPlatform = require("platform");
var i18n = require("sdk/base/util/I18n");
var ConnectionIterator = require("sdk/modules/mediaplayer/liveStreamConfigApi/ConnectionIterator");
var LiveStreamConfig = require("sdk/modules/mediaplayer/liveStreamConfigApi/LiveStreamConfig");
var LocationHelper = require("sdk/base/util/LocationHelper");
var MediaElement = require("sdk/base/util/MediaElement");
var _ = require("lodash");

define([
  "dojo/_base/array",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/has",
  "dojo/on",
  "dojo/topic",
  "dojo/_base/window",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/dom-attr",
  "sdk/modules/ad/AdManager",
  "sdk/modules/base/CoreModule",
  "sdk/modules/mediaplayer/Html5",
  "sdk/modules/mediaplayer/Flash",
  "sdk/base/playback/StreamingMode",
], function (
  array,
  declare,
  lang,
  has,
  on,
  topic,
  win,
  dom,
  domConstruct,
  domAttr,
  AdManager,
  coreModule,
  Html5,
  Flash,
  StreamingMode
) {
  /**
   * @namespace tdapi/modules/MediaPlayer
   */
  var module = declare([coreModule], {
    LIVE_PLAYING: "livePlaying",
    LIVE_STOPPED: "liveStopped",

    /**
     * Convert stream status code to dojo i18n localized messages
     *
     * @ignore
     */
    statusMap: {
      GETTING_STATION_INFORMATION: {
        status: "gettingStationInformation",
        code: "GETTING_STATION_INFORMATION",
      },
      STREAM_GEO_BLOCKED: {
        status: "streamGeoBlocked",
        code: "STREAM_GEO_BLOCKED",
      },
      STREAM_GEO_BLOCKED_ALTERNATE: {
        status: "streamGeoBlockedAlternate",
        code: "STREAM_GEO_BLOCKED_ALTERNATE",
      },
      STREAM_GEO_BLOCKED_NO_ALTERNATE: {
        status: "streamGeoBlockedNoAlternate",
        code: "STREAM_GEO_BLOCKED_NO_ALTERNATE",
      },
      STATION_NOT_FOUND: {
        status: "stationNotFound",
        code: "STATION_NOT_FOUND",
      },
      PLAY_NOT_ALLOWED: {
        status: "playbackNotAllowed",
        code: "PLAY_NOT_ALLOWED",
      },
    },

    constructor: function (config, target) {
      console.log("mediaPlayer::constructor");

      this.inherited(arguments);
      var self = this;
      if (typeof __cmp === "function") {
        console.log("techModule::__cmp");
        __cmp("getConsentData", null, function (consentData) {
          self.consentData = consentData;
          if (self.config.idSync != undefined) {
            self._loadIdSync(self.config.idSync);
          }
        });
      } else if (typeof __tcfapi === "function") {
        __tcfapi("getTCData", 2, (tcData, success) => {
          if (success) {
            self.consentData = tcData;
            if (self.config.idSync != undefined) {
              self._loadIdSync(self.config.idSync);
            }
          } else {
            console.error("Failed to get the TCF data");
          }
        });
      } else if (this.config.idSync != undefined) {
        this._loadIdSync(this.config.idSync);
      }

      this.liveStreamConfig = null;
      this.streamingConnections = null;
      this.liveStreamConfiguration = null;

      this.tech = null; //Tech class instance
      this.techErrors = [];

      this.techPriority =
        this.config.techPriority && this.config.techPriority.length > 0
          ? this.config.techPriority
          : ["Html5", "Flash"];

      this.geoTargeting =
        this.config.geoTargeting != undefined
          ? this.config.geoTargeting
          : {
              desktop: {
                isActive: true,
              },
              iOS: {
                isActive: false,
              },
              android: {
                isActive: false,
              },
            };
      this.isGeoTargetingActive = false;
      this.position = null; //Geographic position

      if (this.geoTargeting) {
        this._initGeoTargeting();
      }

      this.hls = config.hls != undefined ? config.hls : true;
      this.audioAdaptive =
        config.audioAdaptive != undefined ? config.audioAdaptive : false;

      if (config.audioAdaptive) {
        config.forceHls = true;
      }

      this.adManager = null; //Ad Manager instance
      this._lowActivated = false;
      this._isPlaying = false;
      this.fallbackTried = false;

      this.api = {
        play: lang.hitch(this, this._play),
        pause: lang.hitch(this, this._pause),
        stop: lang.hitch(this, this._stop),
        resume: lang.hitch(this, this._resume),
        seekFromLive: lang.hitch(this, this._seekFromLive),
        seek: lang.hitch(this, this._seek),
        seekLive: lang.hitch(this, this.seekLive),
        restartConnectionTimeOut: lang.hitch(
          this,
          this.restartConnectionTimeOut
        ),
        setVolume: lang.hitch(this, this.setVolume),
        getVolume: lang.hitch(this, this.getVolume),
        mute: lang.hitch(this, this.mute),
        unMute: lang.hitch(this, this.unMute),
        playAd: lang.hitch(this, this.playAd),
        skipAd: lang.hitch(this, this.skipAd),
        destroyAd: lang.hitch(this, this.destroyAd),
        initMediaElement: lang.hitch(this, this._initMediaElement),
        destroy: lang.hitch(this, this._destroy),
        reloadSyncBanner: lang.hitch(this, this.reloadSyncBanner),
        getCloudStreamInfo: lang.hitch(this, this._getCloudStreamInfo),
        playProgram: lang.hitch(this, this._playProgram),
      };
      topic.subscribe(
        "api/request",
        lang.hitch(this, this._onApiInternalRequest)
      );
      topic.subscribe(
        "streamingModeChange",
        lang.hitch(this, this._switchStreamingMode)
      );
    },

    start: function () {
      console.log("mediaPlayer::start");

      on(this.target, "tech-ready", lang.hitch(this, this._onTechReady));
      on(this.target, "tech-error", lang.hitch(this, this._onTechError));

      this._loadTech(this.techPriority[0]);
    },

    _onApiInternalRequest: function () {
      var action = arguments[0];

      var fn = lang.hitch(this, this.INTERNAL_REQUEST_API_FUNCTIONS[action]);
      if (typeof fn === "function") {
        fn(arguments[1]); //arguments[1] = params
      }
    },

    _onApiRequestGetAlternateContent: function (alternateContent) {
      console.log(
        "MediaPlayer::_onApiRequestGetAlternateContent - alternateContent:"
      );
      console.log(alternateContent);

      if (!alternateContent) return;

      var params = this._getCurrentLiveApiParams();

      if (alternateContent.mount) {
        params.station = null;
        params.mount = alternateContent.mount;
        this._play(params);
      } else if (alternateContent.url) {
        params.station = null;
        params.mount = null;
        params.url = alternateContent.url;
        this.tech.isLiveStream = true;
        this.tech.play({
          file: params.url,
        });
      }
    },

    _onApiRequestGetVastInstream: function (adBreakData) {
      console.log("MediaPlayer::_onApiRequestGetVastInstream - adBreakData:");
      console.log(adBreakData);

      if (adBreakData.vastUrl != null) {
        this._getAdManager().playAd("vastAd", {
          url: adBreakData.vastUrl,
          skipMediaAdPlayback: true,
          adBreak: true,
        });
      } else if (adBreakData.adVast != null) {
        this._getAdManager().playAd("vastAd", {
          rawXML: adBreakData.adVast,
          skipMediaAdPlayback: true,
          adBreak: true,
        });
      }
    },

    _switchStreamingMode: function () {
      //Arguement is to what streaming mode we should switch too.
      var mode = arguments[0];
      if (mode == StreamingMode.CLOUD_STREAMING) {
        this._stop();
        setTimeout(() => {
          this._playTimeshift();
        }, 500);
      } else {
        this._stop();
        setTimeout(() => {
          let params = this._getCurrentLiveApiParams();
          params.timeShift = false;
          params.isProgram = false;
          this._play(params);
        }, 500);
      }
    },

    /**
     * List of tags considered as HQ
     */
    _hqTags: [],

    /**
     * Add a new tag in the HQ tags
     * @param tag
     */
    addHqTag: function (tag) {
      if (array.indexOf(this._hqTags, tag) == -1) this._hqTags.push(tag);
    },

    /**
     * Remove a tag from the HQ tags
     * @param tag
     */
    removeHqTag: function (tag) {
      var idx = array.indexOf(this._hqTags, tag);
      if (idx != -1) this._hqTags.splice(idx, 1);
    },

    /**
     * List of tags considered as LOW
     */
    _lowTags: ["low-bw"],

    /**
     * Add a new tag in the LOW tags
     * @param tag
     */
    addLowTag: function (tag) {
      if (array.indexOf(this._lowTags, tag) == -1) this._lowTags.push(tag);
    },

    /**
     * Remvoe a tag from the LOW tags
     * @param tag
     */
    removeLowTag: function (tag) {
      var idx = array.indexOf(this._lowTags, tag);
      if (idx != -1) this._lowTags.splice(idx, 1);
    },

    /**
     * Determine if HQ tags are enabled
     */
    _hqEnabled: false,

    enableHQ: function () {
      this._hqEnabled = true;

      if (!this.isHQ() && this.isPlaying()) {
        this._stop();
        this._play(this._getCurrentLiveApiParams());
      }
    },

    disableHQ: function () {
      this._hqEnabled = false;

      if (this.isHQ() && this.isPlaying()) {
        this._stop();
        this._play(this._getCurrentLiveApiParams());
      }
    },

    /**
     * Determine if LOW tags are enabled. default: true
     */
    _lowEnabled: true,

    enableLow: function () {
      this._lowEnabled = true;

      //Manually called because we do not call playStream in that situation
      this._refreshConnectionIterator();
    },

    disableLow: function () {
      this._lowEnabled = false;

      if (this.isLow() && this.isPlaying()) {
        this._stop();
        this._play(this._getCurrentLiveApiParams());
      }
    },

    /**
     * Activate low bandwidth
     */
    activateLow: function () {
      if (!this._lowEnabled) return;

      this._lowActivated = true;

      if (!this.isLow() && this.isPlaying()) {
        this._stop();
        this._play(this._getCurrentLiveApiParams());
      } else {
        this._refreshConnectionIterator();
      }
    },

    /**
     * Deactivate low bandwidth
     */
    deactivateLow: function () {
      this._lowActivated = false;

      if (this.isLow() && this.isPlaying()) {
        this._stop();
        this._play(this._getCurrentLiveApiParams());
      } else {
        this._refreshConnectionIterator();
      }
    },

    _refreshConnectionIterator: function (streamingConnections) {
      if (streamingConnections) {
        if (streamingConnections.length > 0) {
          this.emit("stream-config-ready");
          this.tech.setConnectionIterator(
            new ConnectionIterator(streamingConnections)
          );
          return true;
        } else {
          this.emit("stream-config-error", {
            errors: this.liveStreamConfig.mountPointsError,
          });

          this.tech.setConnectionIterator(null);

          var isGeoBlocked = false;
          var alternateContent = false;

          _.forEach(this.liveStreamConfig.mountPointsError, function (m) {
            if (m.status.isGeoBlocked) {
              isGeoBlocked = true;
            }

            if (m.alternateContent) {
              alternateContent = m.alternateContent;
            }
          });

          if (isGeoBlocked) {
            this._emitStreamStatusByCode(this.statusMap.STREAM_GEO_BLOCKED);

            if (alternateContent) {
              topic.publish(
                "api/request",
                "get-alternate-content",
                alternateContent
              );
              this._emitStreamStatusByCode(
                this.statusMap.STREAM_GEO_BLOCKED_ALTERNATE
              );
            } else {
              this._emitStreamStatusByCode(
                this.statusMap.STREAM_GEO_BLOCKED_NO_ALTERNATE
              );
            }
          } else {
            this._emitStreamStatusByCode(this.statusMap.STATION_NOT_FOUND);
          }
        }
        return false;
      }
    },

    /**
     * Load the Tech, either Flash or Html5
     *
     * @param techType
     * @private
     */
    _loadTech: function (techType) {
      console.log("mediaPlayer::_loadTech techType:" + techType);

      var successCallback = lang.hitch(this, this._techLoaded);
      var errorCallback = lang.hitch(this, this._techLoadingError);

      switch (techType) {
        case "Html5":
          this._techLoaded(Html5, techType);
          break;
        case "Flash":
          this._techLoaded(Flash, techType);
          break;
        default:
      }
    },

    //Tech loaded: instantiate it
    _techLoaded: function (TechInstance, techType) {
      console.log("mediaPlayer::_techLoaded");

      this.tech = new TechInstance(this.config, this.target, techType);
      this.tech.start();
    },

    _techLoadingError: function (error) {
      console.error("mediaPlayer::_techError - " + error);

      this.emit("module-error", {
        id: "MediaPlayer",
        error: error,
      });
    },

    _onTechReady: function (e) {
      console.log("mediaPlayer::_onTechReady");
      this.liveStreamConfig = new LiveStreamConfig(
        this.config.platformId,
        OsPlatform,
        this.tech.type,
        this.config.hls,
        this.config.audioAdaptive,
        this.config.forceHls,
        this.config.forceHslts,
        this.config.playerServicesRegion
      );

      on(this.target, "stream-start", lang.hitch(this, this._onStreamStart));
      on(this.target, "stream-stop", lang.hitch(this, this._onStreamStop));

      this.emit("module-ready", {
        id: "MediaPlayer",
        module: this,
      });
    },

    _onStreamStart: function () {
      this._isPlaying = true;
    },

    _onStreamStop: function () {
      this._isPlaying = false;
    },

    _onTechError: function (e) {
      console.error("mediaPlayer::_onTechError");

      if (this.techPriority.length > 1 && this.fallbackTried == false) {
        this.techErrors.push(e);
        this.fallbackTried = true;
        this._loadTech(this.techPriority[1]);
      } else {
        this.techErrors.push(e);
        this.emit("module-error", {
          id: "MediaPlayer",
          errors: this.techErrors,
        });
      }
    },

    _initGeoTargeting: function () {
      if (
        has("ios") != undefined &&
        this.geoTargeting.iOS != undefined &&
        this.geoTargeting.iOS.isActive != undefined &&
        this.geoTargeting.iOS.isActive == true
      ) {
        this.isGeoTargetingActive = true;
      } else if (
        has("android") != undefined &&
        this.geoTargeting.android != undefined &&
        this.geoTargeting.android.isActive != undefined &&
        this.geoTargeting.android.isActive == true
      ) {
        this.isGeoTargetingActive = true;
      } else if (
        has("ios") == undefined &&
        has("android") == undefined &&
        this.geoTargeting.desktop != undefined &&
        this.geoTargeting.desktop.isActive != undefined &&
        this.geoTargeting.desktop.isActive == true
      ) {
        this.isGeoTargetingActive = true;
      }

      if (this.isGeoTargetingActive == true) this._getLocation();
    },

    /**
     *
     * Play a stream OR a simple media file (podcast)
     *
     * Call the LiveStream Api to be able to start the playback of a live audio/video stream.
     *
     * @param {Object} params playstream/media file configuration object
     *
     * {string}  url : url of the stream appended with the tracking parameters. Ex:http://3143.live.streamtheworld.com:80/WBUFFM.mp3?lat=45.5&long=-73.6&pname=TdPlayerApi&pversion=2.5&banners=300x250%2C728x90<br>
     * {string}  format : format of the stream. Ex:FLV<br>
     * {string}  mimeType : mimeType of the stream. Ex: audio/mpeg;codecs=mp3<br>
     * {string}  station : station to be played. Ex:TRITONRADIOMUSIC.<br>
     * {string}  mount : mount to be played. Ex:WBUFFM.<br>
     * {Object}  sbmConfig Ex : { active:true, aSyncCuePointFallback:true }<br>
     * {Boolean} sendPageUrl : Set true if send-page-url is true in the mountPoint configuration (LiveStreamConfig) <br>
     * {Boolean} timeShift : Set to true to enable the client-side time-shifting. Set to false to Disable time-shifting. @default is false.<br>
     * {Boolean} hasVideo : Set true if it's a video stream.
     * {string}  type : audio or video.
     * {Boolean} uuidEnabled : Set true if uuid is true in the mountPoint configuration (LiveStreamConfig) <br>
     */

    _play: function (params) {
      if (params == undefined) return;

      this.tech.prepare(); //Prepare tech (Html5 require media tag to initialized before xhr call)
      //init media element
      this._initMediaElement();
      if (params.timeShift || params.forceTimeShift) {
        var transports = this.liveStreamConfig.TIMESHIFT_TRANSPORT;
        params.timeshiftEnabled = false; //This is the live play of the timeshift enabled station, so play HLS so that we can get the cookie header.
        this.liveStreamConfig = new LiveStreamConfig( //Get a new LiveStreamConfig and force hls.
          this.config.platformId,
          OsPlatform,
          this.tech.type,
          true,
          this.config.audioAdaptive,
          true,
          true,
          this.config.playerServicesRegion
        );
      } else {
        var transports = this.liveStreamConfig.DEFAULT_TRANSPORTS;
        params.timeshiftEnabled = false;
      }

      if (params.forceTimeShift) {
        params.timeshiftEnabled = true;
        this._liveApiParams = params;
        this._playTimeshift();
        return;
      }

      var self = this;

      params.trackingParameters = this._getFinalTrackingParameters(
        params.trackingParameters
      );

      if (params.file != undefined && params.file != "") {
        console.log("mediaPlayer::play - file=" + params.file);

        self.tech.play(params);
      } else {
        console.log(
          "mediaPlayer::play - station=" +
            params.station +
            ", connectionTimeOut=" +
            params.connectionTimeOut +
            ", timeShift=" +
            params.timeShift
        );

        this._emitStreamStatusByCode(
          this.statusMap.GETTING_STATION_INFORMATION
        ); //Fire Getting Station information status event

        this._liveApiParams = params; //Set Live API params

        var liveStreamConfigParams = {
          station: params.station,
          mount: params.mount,
          transports: transports,
        };

        var mountTags = [];
        if (this._hqEnabled) mountTags = mountTags.concat(this._hqTags);
        if (this._lowEnabled) mountTags = mountTags.concat(this._lowTags);

        this.liveStreamConfig
          .getStreamingConnections(
            liveStreamConfigParams,
            mountTags,
            false,
            false
          )
          .then(function (streamingConnections) {
            this.streamingConnections = streamingConnections;
            if (self._refreshConnectionIterator(streamingConnections)) {
              self.tech.play(params);
            }
          })
          .catch(function (error) {
            self.emit("stream-config-load-error", {
              error: error,
            });
          });
      }
    },

    _playTimeshift: function (isProgram, programID, offset) {
      if (this._getCurrentLiveApiParams == undefined) return;
      let params = this._getCurrentLiveApiParams();
      params.isProgram = isProgram;
      params.offset = offset;
      params.timeShift = true;
      params.timeshiftEnabled = true;

      this.tech.prepare(); //Prepare tech (Html5 require media tag to initialized before xhr call)
      //init media element
      this._initMediaElement();

      var self = this;

      console.log(
        "mediaPlayer::play - station=" +
          params.station +
          ", connectionTimeOut=" +
          params.connectionTimeOut +
          ", timeShift=" +
          params.timeShift
      );

      this._emitStreamStatusByCode(this.statusMap.GETTING_STATION_INFORMATION); //Fire Getting Station information status event

      var transports = this.liveStreamConfig.TIMESHIFT_TRANSPORT;

      var liveStreamConfigParams = {
        station: params.station,
        mount: params.mount,
        transports: transports,
        isProgram: isProgram,
        programID: programID,
      };

      this.liveStreamConfig
        .getStreamingConnections(liveStreamConfigParams, [], false, true)
        .then(function (streamingConnections) {
          this.streamingConnections = streamingConnections;
          if (streamingConnections && streamingConnections.length == 0) {
            self.emit("stream-config-load-error", {
              error: "No Timeshift mount enabled",
            });
          } else if (self._refreshConnectionIterator(streamingConnections)) {
            self.tech.play(params);
          }
        })
        .catch(function (error) {
          self.emit("stream-config-load-error", {
            error: error,
          });
        });
    },

    /**
     * Returns true if the stream is currently playing
     * @returns {boolean}
     */
    isPlaying: function () {
      return this._isPlaying;
    },

    /**
     * Returns true if there is a mountPoint considered as 'HQ'
     * @returns {boolean}
     */
    hasHQ: function () {
      var self = this;
      return _.some(this._hqTags, function (tag) {
        self.tagsToLookup(tag, self.streamingConnections);
      });
    },

    tagsToLookup: function (tag, streamingConnections) {
      return _.some(streamingConnections, function (sc) {
        return _.some(sc.tags, function (sc_tag) {
          return sc_tag.name === tag;
        });
      });
    },

    /**
     * Returns true if the current connection mountpoint is 'HQ'
     * @returns {boolean}
     */
    isHQ: function () {
      var self = this;
      if (!this.tech.currentConnection()) return false;

      return this.tech.currentConnection() != null
        ? _.some(this._hqTags, function (tag) {
            self.tagsToLookup(tag, [self.tech.currentConnection()]);
          })
        : false;
    },

    /**
     * Returns true if there is a mountPoint considered as 'LOW'
     * @returns {boolean}
     */
    hasLow: function () {
      var self = this;
      return _.some(this._lowTags, function (tag) {
        self.tagsToLookup(tag, self.streamingConnections);
      });
    },

    /**
     * Returns true if the current connection mountpoint is 'LOW'
     * @returns {boolean}
     */
    isLow: function () {
      var self = this;

      if (!this.tech.currentConnection()) return false;
      return this.tech.currentConnection() != null
        ? _.some(this._lowTags, function (tag) {
            self.tagsToLookup(tag, [self.tech.currentConnection()]);
          })
        : false;
    },

    /**
     * Pause the live audio/video stream OR a media file
     */
    _pause: function () {
      console.log("mediaPlayer::pause");

      this.tech.pause();
    },

    /**
     * Stop live stream or a media file
     */
    _stop: function () {
      console.log("mediaPlayer::stop");

      this.tech.stop();
    },

    /**
     * Resume live stream or a media file
     */
    _resume: function () {
      console.log("mediaPlayer::resume");

      this.tech.resume();
    },

    /**
     * Seek in the live stream (time-shifting) or in a media file<br>
     * Time-shifting not supported: iOS, Android
     *
     * @param {number} seekOffset
     */
    _seek: function (seekOffset) {
      console.log("mediaPlayer::seek - seekOffset=" + seekOffset);

      this.tech.seek(seekOffset);
    },

    _seekFromLive: function (seconds) {
      console.log("mediaPlayer::seekFromLive =" + seconds);

      this.tech.seekFromLive(seconds);
    },

    /**
     * Get a list of the timeshift programs available
     */
    _getCloudStreamInfo: function (stationName) {
      console.log("mediaPlayer::_getCloudStreamInfo");

      var liveStreamConfigParams = {
        station: stationName,
        transports: this.liveStreamConfig.TIMESHIFT_TRANSPORT,
      };

      var context = this;
      this.liveStreamConfig
        .getStreamingConnections(liveStreamConfigParams, [], false, true)
        .then(function (streamingConnections) {
          if (streamingConnections) {
            let streamInfoUrl =
              "https://" +
              streamingConnections[0].mrHost +
              "/" +
              streamingConnections[0].mount +
              "/CLOUD/stream-info";

            //streamInfoUrl = "http://0.0.0.0:8000/" + this.params.mount + "/CLOUD/programs"
            console.log("Get The timeshift cloud stream info:" + streamInfoUrl);
            fetch(streamInfoUrl)
              .then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `Request failed with status ${reponse.status}`
                  );
                }

                return response.json();
              })
              .then(lang.hitch(context, context._onCloudStreamLoadInfoComplete))
              .catch((error) => {
                context.emit("timeshift-program-load-error", {
                  error: error,
                });
              });
          }
        })
        .catch(function (error) {
          context.emit("timeshift-program-load-error", {
            error: "Could not load program",
          });
        });
    },

    _onCloudStreamLoadInfoComplete: function (data) {
      if (!data) {
        programs = '{"programs":[]}';
        this.emit("timeshift-info", data.programs);
      }

      if (data.programs.properties) {
        programs = {
          maximum_rewind_time_sec: data.maximum_rewind_time_sec,
          programs: [data.programs],
        };
        this.emit("timeshift-info", programs);
      }
    },

    _playProgram: function (programID, offset, station) {
      console.log("mediaPlayer::_playProgram - programID=" + programID);
      this._stop();
      if (station == undefined) return;

      if (this._liveApiParams) {
        this._liveApiParams.station = station;
        this._liveApiParams.timeShift = true;
        this._liveApiParams.timeshiftEnabled = true;
      } else {
        this._liveApiParams = {
          station: station,
          timeShift: true,
          timeshiftEnabled: true,
        };
      }

      this._stop();
      setTimeout(() => {
        this._playTimeshift(true, programID, offset);
      }, 500);
    },

    /**
     * Back to live<br>
     * Not supported: iOS, Android
     */
    seekLive: function () {
      console.log("mediaPlayer::seekLive");

      this.tech.seekLive();
    },

    /**
     * Restart the connection timeout
     */
    restartConnectionTimeOut: function () {
      console.log("mediaPlayer::restartConnectionTimeOut");

      this.tech.restartConnectionTimeOut();
    },

    /**
     * Set the volume<br>
     * Not supported: iOS, Android
     *
     * @param {Number} volumePercent The volume percentage between 0 and 1
     */
    setVolume: function (volumePercent) {
      console.log("mediaPlayer::setVolume - volumePercent=" + volumePercent);

      this.tech.setVolume(volumePercent);
    },

    /**
     * Return the current volume<br>
     * Not supported: iOS, Android
     *
     * @return {Number} The volume percentage between 0 and 1
     */
    getVolume: function () {
      return this.tech.getVolume();
    },

    /**
     * Mute the volume<br>
     * Not supported: iOS, Android
     */
    mute: function () {
      console.log("mediaPlayer::mute");

      this.tech.mute();
    },

    /**
     * Un-Mute the volume<br>
     * Not supported: iOS, Android
     */
    unMute: function () {
      console.log("mediaPlayer::unMute");
      this.tech.unMute();
    },

    /**
     * Play an ad
     *
     * @param {string} adServerType
     * @param {object} config
     */
    playAd: function (adServerType, config) {
      console.log("mediaPlayer::playAd - adServerType = " + adServerType);

      config.trackingParameters = this._getFinalTrackingParameters(
        config.trackingParameters
      );

      this._getAdManager().playAd(adServerType, config);
      this.tech.playAdCalled = true;
    },

    /**
     * Skip the ad
     *
     */
    skipAd: function () {
      console.log("mediaPlayer::skipAd");

      this._getAdManager().skipAd();
    },
    /**
     * Reload a SyncBanner
     *
     */
    reloadSyncBanner: function () {
      console.log("mediaPlayer::reloadSyncBanner");

      this._getAdManager().reloadSyncBanner();
    },

    /**
     * Destroy the ad
     *
     */
    destroyAd: function () {
      console.log("mediaPlayer::destroyAd");

      this._getAdManager().destroyAd(true);
    },

    _initMediaElement: function () {
      console.log("mediaPlayer::_initMediaElement");

      MediaElement.init();
    },

    _destroy: function () {
      this._stop();
      setTimeout(function () {
        var playerElement = document.getElementById("tdplayer_ondemand");
        if (playerElement) {
          domConstruct.destroy(playerElement);
        }
        MediaElement.destroyAudioElement();
        MediaElement.resetAudioNode();
      }, 500);
    },

    _getAdManager: function () {
      if (this.adManager == null)
        this.adManager = new AdManager(
          this.tech,
          this.tech.type,
          this.target,
          this.config
        );

      return this.adManager;
    },

    _emitStreamStatusByCode: function (statusMapEntry) {
      var statusMessages = i18n.getLocalization();
      if (statusMessages == undefined) return;

      if (statusMessages[statusMapEntry.status]) {
        this.emit("stream-status", {
          code: statusMapEntry.code,
          status: statusMessages[statusMapEntry.status],
        });
      }
    },

    _getLocation: function () {
      if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
          lang.hitch(this, this._setPosition),
          lang.hitch(this, this._getPositionErrorHandler),
          {
            enableHighAccuracy: true,
            timeout: 2000,
          }
        );
      }
    },

    _setPosition: function (position) {
      this.position =
        position != undefined &&
        position.coords.latitude != undefined &&
        position.coords.longitude != undefined
          ? position
          : null;
    },

    _getPositionErrorHandler: function (error) {
      console.info(
        "mediaPlayer::_getPositionErrorHandler, code : " +
          error.code +
          ", message : " +
          error.message
      );

      this.position = null;
    },

    _getGeoTargetingPos: function (trackingParameters) {
      if (
        this.position != null &&
        this.position != undefined &&
        this.position.coords.latitude != undefined &&
        this.position.coords.longitude != undefined
      ) {
        if (trackingParameters != undefined) {
          trackingParameters["lat"] = parseFloat(
            this.position.coords.latitude.toFixed(1)
          );
          trackingParameters["long"] = parseFloat(
            this.position.coords.longitude.toFixed(1)
          );
          return trackingParameters;
        } else {
          return {
            lat: parseFloat(this.position.coords.latitude.toFixed(1)),
            long: parseFloat(this.position.coords.longitude.toFixed(1)),
          };
        }
      } else {
        return trackingParameters;
      }
    },

    /**
     * Add tracking parameters
     *
     * @param trackingParameters
     * @returns {*}
     * @private
     */
    _getFinalTrackingParameters: function (trackingParameters) {
      if (trackingParameters == undefined) {
        trackingParameters = {};
      }

      trackingParameters.tdsdk =
        this.config.defaultTrackingParameters.log.tdsdk;
      trackingParameters.swm = this.config.streamWhileMuted
        ? this.config.streamWhileMuted
        : false;

      if (this.isGeoTargetingActive) {
        trackingParameters = this._getGeoTargetingPos(trackingParameters);
      }

      if (_.isEmpty(this.config.defaultTrackingParameters.banners)) {
        this.config.defaultTrackingParameters.banners = [];
        this.config.defaultTrackingParameters.banners.push("none");
      }

      //Banner capabilities for Flash: swf, vpaid only if AdBlocker not detected
      if (
        this.tech.type == "Flash" &&
        !this.config.adBlockerDetected &&
        this.config.defaultTrackingParameters.banners.indexOf("none") === -1
      ) {
        if (
          array.indexOf(this.config.defaultTrackingParameters.banners, "swf") ==
          -1
        ) {
          this.config.defaultTrackingParameters.banners.push("swf");
        }

        if (
          array.indexOf(
            this.config.defaultTrackingParameters.banners,
            "vpaid"
          ) == -1
        ) {
          this.config.defaultTrackingParameters.banners.push("vpaid");
        }
      }

      //Logging pname and pversion - if pname is already specified, do not override them with these values.
      if (!trackingParameters.pname) {
        trackingParameters.pname =
          this.config.defaultTrackingParameters.log.pname;
        trackingParameters.pversion =
          this.config.defaultTrackingParameters.log.pversion;
      }

      if (
        this.config.defaultTrackingParameters.banners != undefined &&
        this.config.defaultTrackingParameters.banners.length
      ) {
        if (
          trackingParameters.banners != undefined &&
          trackingParameters.banners.length &&
          trackingParameters.banners.indexOf(
            this.config.defaultTrackingParameters.banners.join()
          ) == -1
        ) {
          trackingParameters.banners +=
            "," + this.config.defaultTrackingParameters.banners.join(); //merge defaultTrackingParameters['banners'] with trackingParameters['banners']
        } else {
          trackingParameters.banners =
            this.config.defaultTrackingParameters.banners.join(); //assign defaultTrackingParameters['banners'] to trackingParameters['banners']
        }
      }

      //User data (see tdapi/modules/base/UserRegPlayerMediator)
      for (var userData in this.config.defaultTrackingParameters.user) {
        trackingParameters[userData] =
          this.config.defaultTrackingParameters.user[userData];
      }

      if (this.consentData) {
        trackingParameters.gdpr = this.consentData.gdprApplies ? 1 : 0;
        trackingParameters.gdpr_consent = this.consentData.consentData
          ? this.consentData.consentData
          : this.consentData.tcString;
      }

      return trackingParameters;
    },

    _getCurrentLiveApiParams: function () {
      return this._liveApiParams;
    },

    _loadIdSync: function (config) {
      var queryParam = this._getIdSyncQueryParam(config);

      if (dom.byId("idSyncScript", document))
        domConstruct.destroy(dom.byId("idSyncScript", document));

      scriptTag = domConstruct.create(
        "script",
        {
          id: "idSyncScript",
        },
        dom.byId(this.config.playerId, document)
      );
      domAttr.set(scriptTag, "type", "text/javascript");

      domAttr.set(
        scriptTag,
        "src",
        "//playerservices.live.streamtheworld.com/api/idsync.js?" + queryParam
      );

      document.getElementsByTagName("body")[0].appendChild(scriptTag);
    },

    _getIdSyncQueryParam: function (config) {
      var queryParam;

      if (config.station) {
        queryParam = "station=" + config.station;
      } else if (config.stationId) {
        queryParam = "stationId=" + config.stationId;
      } else if (config.mount) {
        queryParam = "mount=" + config.mount;
      }

      //return if no required param passed
      if (queryParam == undefined) return;

      if (this.consentData) {
        config.gdpr = this.consentData.gdprApplies ? 1 : 0;
        config.gdpr_consent = this.consentData.consentData
          ? this.consentData.consentData
          : this.consentData.tcString;
      }

      queryParam =
        config.gdpr && config.gdpr.toString().match(/^[0,1]$/g)
          ? queryParam + "&gdpr=" + config.gdpr
          : queryParam;

      queryParam = config.gdpr_consent
        ? queryParam + "&gdpr_consent=" + config.gdpr_consent
        : queryParam;

      //adding Demographic Targeting from advertising guide params
      //dob String formatted as YYYY-MM-DD
      var dob =
        config.dob && !isNaN(Date.parse(config.dob))
          ? new Date(config.dob.replace(/-/g, "/"))
          : null;
      if (dob) {
        var year = dob.getFullYear();
        var month =
          dob.getMonth() + 1 < 10
            ? "0" + (dob.getMonth() + 1)
            : dob.getMonth() + 1;
        var day = dob.getDate() < 10 ? "0" + dob.getDate() : dob.getDate();
        queryParam = dob
          ? queryParam + "&dob=" + year + "-" + month + "-" + day
          : queryParam;
      }

      //yob Integer value
      queryParam =
        config.yob && !isNaN(config.yob) && queryParam.indexOf("dob") === -1
          ? queryParam + "&yob=" + config.yob
          : queryParam;

      //age Integer value: 1 to 125
      queryParam =
        config.age &&
        !isNaN(config.age) &&
        config.age > 0 &&
        config.age <= 125 &&
        queryParam.indexOf("dob") === -1 &&
        queryParam.indexOf("yob") === -1
          ? queryParam + "&age=" + config.age
          : queryParam;

      //gender "m" or "f" or "o" (other)(case-sensitive)
      queryParam =
        config.gender &&
        config.gender.match(/[m,f,o]/g) &&
        config.gender.length === 1
          ? queryParam + "&gender=" + config.gender
          : queryParam;

      //ip valide ip
      queryParam =
        config.ip &&
        config.ip.match(
          /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/g
        )
          ? queryParam + "&ip=" + config.ip
          : queryParam;

      return queryParam;
    },
  });

  return module;
});
