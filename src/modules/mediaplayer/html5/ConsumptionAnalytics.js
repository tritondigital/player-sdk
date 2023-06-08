/**
 * Omny Consumption Analytics API
 */
define([
  "dojo/_base/declare",
  "dojo/on",
  "dojo/_base/lang",
  "sdk/base/playback/PlaybackState",
  "dojo/request",
], function (declare, on, lang, PlaybackState, request) {
  var consumptionAnalytics = declare([], {
    constructor: function (html5Player) {
      var context = this;
      console.log("ConsumptionAnalytics::constructor");
      this.LocalStorageKeyPrefix = "omnyfm:ConsumptionData:";
      this.pushUrl =
        "https://traffic.omny.fm/api/consumption/events?organizationId=";
      this.html5Player = html5Player; //Instance of HTML5 Playback Class
      this.html5Player.on(
        "html5-playback-status",
        lang.hitch(this, this.__onHTML5PlayerStatus)
      );
      this.events = [];
      this.nextSeqNumber = 1;
      this.position = 0;
      this.lastPosition = 0;
      this.started = false;
      this.enabled = true;

      this.flushAndSendAnyLocalStorageConsumptionData();

      on(window, "beforeunload", function () {
        context.onPageUnload();
      });
    },

    init: function (organizationId, clipId, sessionId) {
      this.organizationId = organizationId;
      this.clipId = clipId;
      this.sessionId = sessionId;
    },

    __onHTML5PlayerStatus: function (e) {
      var position = e.mediaNode.currentTime;

      switch (e.type) {
        case PlaybackState.PLAY:
          this.start(position);
          break;

        case PlaybackState.STOP:
          this.finished();
          break;

        case PlaybackState.ENDED:
          this.finished();
          break;

        case PlaybackState.TIME_UPDATE:
          this.setCurrentPosition(position);

        default:
          break;
      }
    },

    isUsingCompletedOnlyMode: function () {
      return this.isBeaconSupported() || this.isLocalStorageSupported();
    },

    isStorageAvailable: function (type) {
      var storage;

      try {
        storage = window[type];
        const x = "__storage_test__";
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
      } catch (e) {
        return (
          e instanceof DOMException &&
          // everything except Firefox
          (e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === "QuotaExceededError" ||
            // Firefox
            e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage &&
          storage.length !== 0
        );
      }
    },

    isUsingLocalStorageTransmissionMode: function () {
      if (!this.isUsingCompletedOnlyMode()) {
        return false;
      }

      // If we support beacons, prefer that
      if (this.isBeaconSupported()) {
        return false;
      }

      // If we have local storage available, use it
      if (this.isLocalStorageSupported()) {
        return true;
      }

      // Otherwise, we have no beacon or local storage
      return false;
    },

    isLocalStorageSupported: function () {
      return this.isStorageAvailable("localStorage");
    },

    onPageUnload: function () {
      if (
        !this.isBeaconSupported() &&
        !this.isUsingLocalStorageTransmissionMode()
      ) {
        return;
      }

      // Ensure we have emitted End event
      if (this.started) {
        this.finished();
      }

      // Flush events
      this.flushEvents();
    },

    isBeaconSupported: function () {
      if (navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
        return false;
      }

      return false;
      //   return navigator.sendBeacon !== undefined;
    },

    pushEvent: function (eventType) {
      if (!this.sessionId) {
        console.log(
          "ConsumptionAnalytics: pushEvent() called before a Session Id was assigned"
        );
        return;
      }

      this.events.push({
        OrganizationId: this.organizationId,
        ClipId: this.clipId,
        SessionId: this.sessionId,
        Type: eventType,
        Position: this.position,
        SeqNumber: this.nextSeqNumber++,
        Timestamp: Math.floor(Date.now() / 1000),
      });
    },

    start: function (position) {
      if (this.started) {
        return;
      }

      this.setCurrentPosition(position, true);

      this.started = true;
      this.pushEvent("Start");
    },

    setCurrentPosition: function (position, force) {
      if (this.started || force) {
        this.lastPosition = this.position;
        this.position = position;
      }
    },

    finished: function () {
      this.pushEvent("Stop");
      this.started = false;
    },

    flushAndSendAnyLocalStorageConsumptionData: function () {
      var context = this;

      if (!this.isLocalStorageSupported()) {
        return;
      }

      var keys = Object.keys(window.localStorage);

      keys.forEach(function (key) {
        // Only process keys with our expected prefix
        if (key.indexOf(context.LocalStorageKeyPrefix) !== 0) {
          return;
        }
        // Send and flush this data
        const jsonData = window.localStorage.getItem(key);
        // Drop from local storage
        window.localStorage.removeItem(key);
        // Send payload
        context.sendConsumptionPayloadToRemoteService(jsonData);
      });
    },

    flushEvents: function () {
      // If not enabled, do nothing
      if (!this.enabled) {
        return;
      }

      // If we have no events, do nothing
      if (this.events.length == 0) {
        return;
      }

      // Send request
      var jsonData = JSON.stringify({
        Source: "CustomWeb",
        Events: this.events,
        Completed: true,
      });

      // If we are operating in localStorage transmission mode, we need to instead stash this data for later transmission on the next page load
      if (this.isUsingLocalStorageTransmissionMode()) {
        window.localStorage.setItem(
          this.LocalStorageKeyPrefix + this.sessionId,
          jsonData
        );
      } else {
        // Send data
        this.sendConsumptionPayloadToRemoteService(jsonData);
      }

      // Clear events
      this.events = [];
      this.nextSeqNumber = 1;
    },

    sendConsumptionPayloadToRemoteService: function (jsonData) {
      var context = this;

      if (this.organizationId == undefined || this.organizationId == null) {
        var analyticsData = JSON.parse(jsonData);
        if (analyticsData.Events == undefined || analyticsData.Events == null) {
          return;
        } else {
          this.organizationId = analyticsData.Events[0].OrganizationId;
        }
      }

      // Use beacon if supported
      if (this.isBeaconSupported()) {
        navigator.sendBeacon(this.pushUrl + this.organizationId, jsonData);
      } else {
        request
          .post(this.pushUrl + this.organizationId, {
            data: jsonData,
            handleAs: "json",
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          })
          .then(function (data) {
            if (!data.Enabled) {
              // IF the server says its disabled... stop pushing events
              context.started = false;
              context.enabled = false;
            }
          });
      }
    },
  });

  return consumptionAnalytics;
});
