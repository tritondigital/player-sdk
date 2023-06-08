/**
 * Sideband metadata<br>
 * Class to support Side-Band metadata mechanism<br>
 * Use by HTML5 technology ONLY
 */

define([
  "dojo/_base/declare",
  "dojo/on",
  "dojo/_base/lang",
  "sdk/modules/mediaplayer/sbm/SidebandMetadataConnector",
], function (declare, on, lang, SidebandMetadataConnector) {
  var sidebandMetadata = declare([], {
    /**
     * Constructor argument : mediaNode Object (HTML5 audio element)
     *
     * @ignore
     */
    constructor: function (mediaNode) {
      console.log("sidebandMetadata::constructor");

      this._sessionId = null;
      this._mediaNode = mediaNode;
      this._streamTimer = null;
      this._timer = 0;
      this._connectionTime = 0;

      this._onPlayHandler = lang.hitch(this, this.__onTimeUpdate);
    },

    /**
     * Sideband metadata Object initialization
     *
     * @param params
     *
     * @ignore
     */
    init: function (params) {
      this._connectionTime = new Date().getTime();
      this._streamTimer = setInterval(this._onPlayHandler, 250);
      this.sidebandMetadataConnector = new SidebandMetadataConnector();
      this.sidebandMetadataConnector.setSidebandMetadataFallbackCallback(
        lang.hitch(this, this.__onSidebandMetadataFallback)
      );
      this.sidebandMetadataConnector.connect(
        this.__getMetadataConnectionUrl(
          params.url,
          params.mount,
          params.sbmConfig
        )
      );
    },

    /**
     *
     * Destroy the Sideband Metadata connector
     *
     */
    destroy: function () {
      if (this.onTimeUpdateListener) {
        this.onTimeUpdateListener.remove();
      }

      clearInterval(this._streamTimer);
      this._timer = 0;
      this._connectionTime = 0;

      if (this.sidebandMetadataConnector) {
        this.sidebandMetadataConnector.destroy();
      }
      delete this.sidebandMetadataConnector;
    },

    /**
     *
     * Build and Return a stream connection URL
     *
     * @param url
     * @returns {string}
     */
    getStreamConnectionUrl: function (url) {
      return (
        url +
        (url.indexOf("?") != -1 ? "&" : "?") +
        "sbmid=" +
        this.__generateSessionId()
      );
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

    /**
     * Handler to know when a HlsCuePoint is dispatched
     */
    setHlsCuePointCallback: function (callback) {
      this._hlsCuePointCallback = callback;
    },

    /**
     * Handler to know when a SpeechCuePoint is dispatched
     *
     * @param callback
     */
    setSpeechCuePointCallback: function (callback) {
      this._speechCuePointCallback = callback;
    },

    /**
     * Handler to know when a CustomCuePoint is dispatched
     *
     * @param callback
     */
    setCustomCuePointCallback: function (callback) {
      this._customCuePointCallback = callback;
    },

    /**
     * Handler to know when an Side-Band Metadata error happened
     */
    setErrorCallback: function (callback) {
      this._errorCallback = callback;
    },

    /* ########################################################### */
    /* ##################### PRIVATE FUNCTIONS ################### */
    /* ########################################################### */

    /**
     *
     * Build and Return a Side-Band Metadata connection URL
     *
     * @param url
     * @param mount
     * @param sbmConfig
     * @returns {*}
     * @private
     */
    __getMetadataConnectionUrl: function (url, mount, sbmConfig) {
      if (url && mount && sbmConfig !== null && sbmConfig.info !== null) {
        return (
          url.split("/")[0] +
          "//" +
          url.split("/")[2] +
          "/" +
          mount +
          sbmConfig.info.metadataSuffix +
          "?sbmid=" +
          this._sessionId
        );
      }
      return null;
    },

    /**
     *
     * Generate a SBM Session Id. Type 4 (i.e. random) UUID, formatted as a lowercase hex string
     *
     * @returns {string}
     * @private
     */
    __generateSessionId: function () {
      var d = new Date().getTime();
      this._sessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (d + Math.random() * 16) % 16 | 0;
          d = Math.floor(d / 16);
          return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
        }
      );

      return this._sessionId;
    },

    /**
     *
     * Destroy the Sideband Metadata
     * Call the error Callback
     *
     * @private
     */
    __onSidebandMetadataFallback: function () {
      console.log("sidebandMetadata::__onSidebandMetadataFallback");

      this.destroy();

      this._errorCallback({});
    },

    /**
     *
     * MediaNode Time update Event Handler
     *
     * @private
     */

    __onTimeUpdate: function () {
      this._timer = new Date().getTime() - this._connectionTime;

      if (this.isStopped || this.isPaused) return;

      if (
        this.sidebandMetadataConnector &&
        this.sidebandMetadataConnector.getCurrentCuePoint() &&
        this._timer >=
          this.sidebandMetadataConnector.getCurrentCuePoint().timestamp
      ) {
        if (
          this.sidebandMetadataConnector.getCurrentCuePoint().type === "track"
        ) {
          this._trackCuePointCallback({
            cuePoint: this.sidebandMetadataConnector.getCurrentCuePoint(),
          });
        } else if (
          this.sidebandMetadataConnector.getCurrentCuePoint().type === "ad"
        ) {
          this._adBreakCuePointCallback({
            cuePoint: this.sidebandMetadataConnector.getCurrentCuePoint(),
          });
        } else if (
          this.sidebandMetadataConnector.getCurrentCuePoint().type === "hls"
        ) {
          this._hlsCuePointCallback({
            cuePoint: this.sidebandMetadataConnector.getCurrentCuePoint(),
          });
        } else if (
          this.sidebandMetadataConnector.getCurrentCuePoint().type === "speech"
        ) {
          this._speechCuePointCallback({
            cuePoint: this.sidebandMetadataConnector.getCurrentCuePoint(),
          });
        } else if (
          this.sidebandMetadataConnector.getCurrentCuePoint().type === "custom"
        ) {
          this._customCuePointCallback({
            cuePoint: this.sidebandMetadataConnector.getCurrentCuePoint(),
          });
        }

        this.sidebandMetadataConnector.shiftCuePointQueue();
      }
    },
  });

  return sidebandMetadata;
});
