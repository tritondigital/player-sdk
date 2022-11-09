var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Hls = require("hls.js");
var PlaybackState = require("sdk/base/playback/PlaybackState");
var StateMachine = require("javascript-state-machine");
var OsPlatform = require("platform");

var STATE = {
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  STOPPED: "STOPPED",
  PAUSED: "PAUSED",
};

var fsm = StateMachine.create({
  initial: STATE.STOPPED,
  error: function (eventName, from) {
    console.warn("Event", eventName, "inappropriate in current state", from);
  },
  events: [
    {
      name: "play",
      from: STATE.STOPPED,
      to: STATE.PLAYING,
    },
    {
      name: "play",
      from: STATE.PLAYING,
      to: STATE.PLAYING,
    },
    {
      name: "stop",
      from: STATE.PLAYING,
      to: STATE.STOPPED,
    },
    {
      name: "stop",
      from: STATE.PAUSED,
      to: STATE.STOPPED,
    },
    {
      name: "pause",
      from: STATE.PLAYING,
      to: STATE.PAUSED,
    },
    {
      name: "resume",
      from: STATE.PAUSED,
      to: STATE.PLAYING,
    },
  ],
});

function _onLoadedData() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  this.emit("html5-playback-status", {
    type: PlaybackState.DATA_LOADING,
    mediaNode: this.audioNode,
  });
}

function _onLoadStart() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  this.emit("html5-playback-status", {
    type: PlaybackState.LOAD_START,
    mediaNode: this.audioNode,
  });
}

function _onCanPlay() {
  var context = this;

  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  if (this.url !== null) {
    if (
      OsPlatform.name === "IE" &&
      OsPlatform.version === "11.0" &&
      parseInt(OsPlatform.os.version) >= 7
    ) {
      this.audioNode.play();
    } else {
      context.emit("html5-playback-status", {
        type: PlaybackState.CAN_PLAY,
        mediaNode: context.audioNode,
      });

      this.audioNode
        .play()
        .then(function () {})
        .catch(function (e) {
          context.handleHTMLPlayError(e);
        });
    }
  }
}

function _onCanPlayThrough() {
  var context = this;
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  if (this.url !== null) {
    if (
      OsPlatform.name === "IE" &&
      OsPlatform.version === "11.0" &&
      parseInt(OsPlatform.os.version) >= 7
    ) {
      this.audioNode.play();
    } else {
      this.audioNode
        .play()
        .then(function () {
          context.emit("html5-playback-status", {
            type: PlaybackState.CAN_PLAY_THROUGH,
            mediaNode: context.audioNode,
          });
        })
        .catch(function (e) {
          context.handleHTMLPlayError(e);
        });
    }
  }
}

function _onWaiting() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  this.emit("html5-playback-status", {
    type: PlaybackState.WAITING,
    mediaNode: this.audioNode,
  });
}

function _onEmptied() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  this.emit("html5-playback-status", {
    type: PlaybackState.EMPTIED,
    mediaNode: this.audioNode,
  });
}

function _onAbort() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  this.emit("html5-playback-status", {
    type: PlaybackState.ABORT,
    mediaNode: this.audioNode,
  });
}

function _onEnded() {
  if (fsm.is(STATE.STOPPED)) return;
  this.emit("html5-playback-status", {
    type: PlaybackState.ENDED,
    mediaNode: this.audioNode,
  });
}

function _onPlay() {
  if (this.url !== null) {
    this.emit("html5-playback-status", {
      type: PlaybackState.PLAY,
      mediaNode: this.audioNode,
    });
  }
}

function _onPause() {
  if (!fsm.is(STATE.STOPPED)) {
    this.emit("html5-playback-status", {
      type: PlaybackState.PAUSE,
      mediaNode: this.audioNode,
    });
  } else {
    this.emit("html5-playback-status", {
      type: PlaybackState.STOP,
      mediaNode: this.audioNode,
    });
  }
}

function _onError(event) {
  let errorMessage = "";
  let errorCode = null;  

  if (event && event.currentTarget && event.currentTarget.error) {    
    errorMessage = event.currentTarget.error.message;
    errorCode = event.currentTarget.error.code;    
  }

  var audioNode = this.audioNode;

  if (fsm.is(STATE.STOPPED)) {
    this.emit("html5-playback-status", {
      type: PlaybackState.STOP,
      mediaNode: audioNode,
    });
  } else if (audioNode.readyState != 3) {
    this.resetAudioNode();
    this.emit("html5-playback-status", {
      type: PlaybackState.ERROR,
      mediaNode: audioNode,
      message: errorMessage,
      code: errorCode,
    });
  } else {
    this.emit("html5-playback-status", {
      type: PlaybackState.STOP,
      mediaNode: audioNode,
    });
  }
}

function _onOffline() {
  console.log("MediaElement::offline");
  if (OsPlatform.name === "Safari") {
    this.stop();
  }
}

function _onTimeUpdate() {
  if (fsm.is(STATE.STOPPED) || fsm.is(STATE.PAUSED)) return;

  if (
    this.audioNode.currentTime.toFixed(1) == this.audioNode.duration.toFixed(1)
  ) {
    this.emit("html5-playback-status", {
      type: PlaybackState.ENDED,
      mediaNode: this.audioNode,
    });
  } else {
    if (!this.isLive) {
      this.emit("html5-playback-status", {
        type: PlaybackState.TIME_UPDATE,
        mediaNode: this.audioNode,
      });
    }
  }
}

function attachEvents() {
  this.boundOnOffline = _onOffline.bind(this);
  this.audioNode.addEventListener("loadeddata", _onLoadedData.bind(this));
  this.audioNode.addEventListener("loadstart", _onLoadStart.bind(this));
  this.audioNode.addEventListener("canplay", _onCanPlay.bind(this));
  this.audioNode.addEventListener(
    "canplaythrough",
    _onCanPlayThrough.bind(this)
  );
  this.audioNode.addEventListener("waiting", _onWaiting.bind(this));
  this.audioNode.addEventListener("emptied", _onEmptied.bind(this));
  this.audioNode.addEventListener("abort", _onAbort.bind(this));
  this.audioNode.addEventListener("ended", _onEnded.bind(this));
  this.audioNode.addEventListener("play", _onPlay.bind(this));
  this.audioNode.addEventListener("pause", _onPause.bind(this));
  this.audioNode.addEventListener("timeupdate", _onTimeUpdate.bind(this));
  this.audioNode.addEventListener("error", _onError.bind(this));
  window.addEventListener("offline", this.boundOnOffline);
}

function removeEvents() {
  if (this.audioNode) {
    this.audioNode.removeEventListener("loadeddata", _onLoadedData);
    this.audioNode.removeEventListener("loadstart", _onLoadStart);
    this.audioNode.removeEventListener("canplay", _onCanPlay);
    this.audioNode.removeEventListener("canplaythrough", _onCanPlayThrough);
    this.audioNode.removeEventListener("waiting", _onWaiting);
    this.audioNode.removeEventListener("emptied", _onEmptied);
    this.audioNode.removeEventListener("abort", _onAbort);
    this.audioNode.removeEventListener("ended", _onEnded);
    this.audioNode.removeEventListener("play", _onPlay);
    this.audioNode.removeEventListener("pause", _onPause);
    this.audioNode.removeEventListener("timeupdate", _onTimeUpdate);
    this.audioNode.removeEventListener("error", _onError);
    window.removeEventListener("offline", this.boundOnOffline);
  }
}

function getAudioNode() {
  if (!this.audioNode) {
    this.audioNode = new Audio();
    this.audioNode.autoplay = false;
    this.audioNode.preload = "none";
    attachEvents.call(this);
  }

  return this.audioNode;
}

module.exports = _.assign(new EventEmitter(), {
  audioNode: null,

  init: function () {
    var context = this;
    this.audioNode = getAudioNode.call(this);
    this.url = null;
    this.audioNode.src = null;
  },

  playAudio: function (url, useHlsLibrary, isLive) {
    if (this.audioNode) {
      this.stop();
    }

    this.audioNode = getAudioNode.call(this);
    this.url = url || this.url;
    this.isLive = isLive || this.isLive;
    this.useHlsLibrary = useHlsLibrary || this.useHlsLibrary;

    if (this.useHlsLibrary) {
      var config = {
        maxBufferLength: 30,
      };
      this.hls = new Hls(config);
      this.hls.attachMedia(this.audioNode);

      this.hls.on(Hls.Events.MEDIA_ATTACHED, this.hlsMediaAttached.bind(this));
    } else {
      this.audioNode.src = url;
      this.audioNode.load();
    }

    fsm.play();
  },

  hlsMediaAttached: function () {
    this.hls.loadSource(this.url);
    this.hls.on(Hls.Events.MANIFEST_PARSED, this.hlsManifestParsed.bind(this));
    this.hls.on(Hls.Events.ERROR, this.hlsError.bind(this));
  },

  hlsManifestParsed: function (event, data) {
    console.log("MediaElement::HLS-event:" + data.type);
  },

  hlsError: function (event, data) {
    if (data.fatal) {
      console.log(
        "MediaElement::HLS-error:" + data.type + " - " + data.details
      );
      this.stop();
    }
  },

  stop: function () {
    var context = this;
    if (fsm.is(STATE.STOPPED)) return;

    this.audioNode = getAudioNode.call(this);

    fsm.stop();

    this.audioNode.pause();
    if (
      OsPlatform.name !== "Safari" ||
      this.audioNode.src.indexOf("m3u8") > -1 ||
      this.useHlsLibrary
    ) {
      setTimeout(function () {
        context.audioNode.src = null;
        context.url = null;
        context.resetAudioNode();
      }, 300);
    } else {
      setTimeout(function () {
        context.url = null;
        context.resetAudioNode();
      }, 300);
    }

    if (OsPlatform.os.family === "iOS" && OsPlatform.name === "Chrome Mobile") {
      window.stop();
    }

    if (this.useHlsLibrary) {
      // Remove hls listeners:
      this.hls.off(Hls.Events.MEDIA_ATTACHED, this.hlsMediaAttached.bind(this));
      this.hls.off(
        Hls.Events.MANIFEST_PARSED,
        this.hlsManifestParsed.bind(this)
      );
      this.hls.off(Hls.Events.ERROR, this.hlsError.bind(this));

      // Destruct hls:
      this.hls.detachMedia();
      this.hls.stopLoad();
      this.hls.destroy();
      // emit stop event after hls listeners killed
      this.emit("html5-playback-status", {
        type: PlaybackState.STOP,
        mediaNode: this.audioNode,
      });
    }
  },

  seekLive: function () {
    if (this.hls) {
      this.audioNode.currentTime = this.hls.liveSyncPosition;
    } else {
      this.audioNode.currentTime = 0;
    }
  },

  pause: function () {
    if (fsm.is(STATE.PAUSED)) return;

    this.audioNode = getAudioNode.call(this);

    this.audioNode.pause();
    fsm.pause();
  },

  resume: function () {
    var context = this;
    if (!fsm.is(STATE.PAUSED)) return;

    this.audioNode = getAudioNode.call(this);
    if (
      OsPlatform.name === "IE" &&
      OsPlatform.version === "11.0" &&
      parseInt(OsPlatform.os.version) >= 7
    ) {
      this.audioNode.play();
    } else {
      this.audioNode.play().catch(function (e) {
        context.handleHTMLPlayError(e);
      });
    }

    fsm.resume();
  },

  mute: function () {
    if (!fsm.is(STATE.PLAYING)) return;
    this.audioNode = getAudioNode.call(this);
    if( this.cfg && this.cfg.streamWhileMuted ){
      this.audioNode.muted = true;
    }else{
      this.stop();
    }
    
  },

  unMute: function () {
    if (fsm.is(STATE.PLAYING)) return;
    this.audioNode = getAudioNode.call(this);
  },

  setVolume: function (volume) {
    this.audioNode = getAudioNode.call(this);
    this.audioNode.volume = volume;
    if (volume == 0 ) {
      this.mute();
    }else {
      this.audioNode.muted = false;
    }
  },

  isStopped: function () {
    return fsm.is(STATE.STOPPED);
  },

  resetAudioNode: function () {
    removeEvents.call(this);
    if (this.audioNode) {
      this.audioNode.src = null;
      this.audioNode = null;
    }

    if (fsm.can("stop")) {
      fsm.stop();
    }
  },

  destroyAudioElement: function () {
    this.emit("destroyAudioElement");
  },

  handleHTMLPlayError: function (e) {
    var context = this;
    if (e.name !== "NotSupportedError") {      
      if (e.name === "NotAllowedError") {
        this.emit("html5-playback-status", {
          type: PlaybackState.PLAY_NOT_ALLOWED,
          mediaNode: context.audioNode,
        });
      }
    }
  },

  /**
   * Can be used to rewind and fast forward stream.
   */
  seekStream: function (seconds) {
    if (seconds !== 0) {
      this.audioNode.currentTime += seconds;
    } else {
      this.audioNode.currentTime = seconds;
    }
  },
});
