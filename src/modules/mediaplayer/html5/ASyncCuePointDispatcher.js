/**
 * Asynchronous cuepoint<br>
 * Class to manage asynchronous cuepoint (polling vs SSE)<br>
 * Use by HTML5 technology ONLY
 */

define([
  "dojo/_base/declare",
  "dojo/on",
  "dojo/Evented",
  "dojo/_base/lang",
  "sdk/modules/NowPlayingApi",
], function (declare, on, Evented, lang, NowPlayingApi) {
  var aSyncCuePointDispatcher = declare([], {
    POLLING_DELAY: 5000,

    /**
     * Constructor argument : aSyncCuePoint Object.
     * By default : { active:true, type:'polling' }
     * active : true/false
     * type : 'polling', 'sse' (coming soon)
     *
     * @ignore
     */
    constructor: function (cfg) {
      console.log("aSyncCuePointDispatcher::constructor");

      this.mount = null;

      this._cuePoint = [];
      this._adBreaks = [];

      this._npChecker = 0;

      /* timer */
      this._npTimerId = null;

      this._init(cfg);
    },

    /**
     * AsyncCuePointDispatcher Object initialization
     * Called by Class constructor
     *
     * @param config
     * @param aSyncCuePoint
     * @private
     *
     * @ignore
     */
    _init: function (cfg) {
      var target = null;

      this.nowPlayingApi = new NowPlayingApi(cfg, new Evented());
      target = this.nowPlayingApi.target;

      this._onCuePointHandler = lang.hitch(this, this._onCuePoint);
      this._onEmptyCuePointHandler = lang.hitch(this, this._onEmptyCuePoint);

      if (target != null) {
        on(target, "cue-point", this._onCuePointHandler);
        on(target, "cue-point-empty", this._onEmptyCuePointHandler);
      }
    },

    /**
     * start asynchronous cuepoints listener
     * Now playing API to get current cuepoint is automatically requested
     * a Timer is started. Every 5000 milliseconds, Now playing API is requested to get current cuepoint
     *
     * @param mount
     * @ignore
     */
    startCuePointsListener: function (mount) {
      this.mount = mount;
      this._getNowPlaying(this.mount);
      this._npTimerId = setInterval(
        lang.hitch(this, function () {
          lang.hitch(this, this._getNowPlaying(this.mount));
        }),
        this.POLLING_DELAY
      );
    },

    /**
     * stop cuepoints listener
     *
     * @ignore
     */
    stopCuePointsListener: function () {
      clearInterval(this._npTimerId);

      //We remove the last item to be sure that we emit a cuePoint when play() is called after a stop()
      if (this._cuePoint.length > 0) this._cuePoint.pop();
    },

    /**
     * Handler to know when a TrackCuePoint is dispatched
     *
     * @param callback
     */
    setTrackCuePointCallback: function (callback) {
      this._trackCuePointCallback = callback;
    },

    /**
     * Handler to know when a BreakCuePoint is dispatched
     */
    setAdBreakCuePointCallback: function (callback) {
      this._adBreakCuePointCallback = callback;
    },

    _getNowPlaying: function (mount) {
      this.nowPlayingApi.load({
        mount: mount,
        hd: false,
        numberToFetch: 1,
        eventType: "track",
        mode: "nowPlaying",
      });
    },

    _onCuePoint: function (e) {
      this.currentCuePoint = e.data.cuePoint;
      this.currentCuePoint.adUrl = null; //Because of Server-Side replacement, the adUrl is removed for now.
      this.currentCuePoint.cueTimeDuration =
        parseInt(this.currentCuePoint.cueTimeDuration) > 0
          ? parseInt(this.currentCuePoint.cueTimeDuration)
          : 15000;

      this.currentMount = e.data.mount;

      var eventType = this.currentCuePoint.type;
      var eventTimestamp = this.currentCuePoint.timestamp;

      if (eventType == "ad") {
        console.log(
          "this.currentCuePoint.adType = " + this.currentCuePoint.adType
        );

        if (this.currentCuePoint.adType == "endbreak") return;

        this._onAdBreak(eventTimestamp);
      } else {
        var artist = this.currentCuePoint.artistName;
        var title = this.currentCuePoint.cueTitle;

        if (this._cuePoint.length > 0) {
          for (var i = 0; i < this._cuePoint.length; i++) {
            if (
              this._cuePoint[i].artist == artist &&
              this._cuePoint[i].title == title
            )
              return;
          }
        }

        if (artist != undefined && title != undefined)
          this._onTrack(artist, title);
      }
    },

    _onTrack: function (artistname, songtitle) {
      if (this._cuePoint.length > 1) this._cuePoint.shift();

      this._cuePoint.push({ artist: artistname, title: songtitle });

      this._trackCuePointCallback({
        mount: this.currentMount,
        cuePoint: this.currentCuePoint,
      });
    },

    _onEmptyCuePoint: function () {
      this._npChecker += 1;

      if (this._npChecker == 3) {
        clearInterval(this._npTimerId);
        this._npChecker = 0;
      }
    },

    _onAdBreak: function (adTimestamp) {
      console.log("onAdBreak - adTimestamp : " + adTimestamp);

      var isAlreadySent = this._adBreakChecker(adTimestamp);

      if (isAlreadySent == false)
        this._adBreakCuePointCallback({
          mount: this.currentMount,
          cuePoint: this.currentCuePoint,
        });
    },

    _adBreakChecker: function (adTimestamp) {
      if (this._adBreaks.length == 0) {
        this._adBreaks.push({ timestamp: adTimestamp });

        return this._cuePoint.length == 0; //if no cuepoint has been received before the first onBreak --> first ad break is ignored because we cannot estimate the duration to display it
      }

      for (var i = 0; i < this._adBreaks.length; i++) {
        if (this._adBreaks[i].timestamp == adTimestamp) {
          return true;
        }
      }
      if (this._adBreaks.length > 2) this._adBreaks.shift();

      this._adBreaks.push({ timestamp: adTimestamp });
      return false;
    },
  });

  return aSyncCuePointDispatcher;
});
